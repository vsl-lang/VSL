import * as llvm from 'llvm-node';
import generateTrap from './generateTrap';

/**
 * Tool for memory managing LLVM stuff. Abstraction point for alloc/dealloc.
 * `size` should be from `backend.module.dataLayout.getTypeStoreSize(type.elementType)``
 *
 * @param {number} size - Size in bytes of memory to alloc.
 * @param {llvm.Type} type - The type that allocation should return.
 * @param {Node} node - The node causing error.
 * @param {LLVMContext} context
 */
export function alloc(size, type, node, context) {
    const backend = context.backend;

    // Get malloc
    let malloc = backend.module.getOrInsertFunction(
        'malloc',
        llvm.FunctionType.get(
            llvm.Type.getInt8PtrTy(backend.context),
            [llvm.Type.getInt64Ty(backend.context)],
            false
        )
    );

    const memory = context.builder.createBitCast(
        context.builder.createCall(
            malloc.callee,
            [llvm.ConstantInt.get(backend.context, size, 64)]
        ),
        type
    );

    if (!context.backend.options.disableAllocCheck) {
        const outOfMemory = llvm.BasicBlock.create(context.ctx, 'alloc.nomem', context.parentFunc);
        const done = llvm.BasicBlock.create(context.ctx, 'alloc.done', context.parentFunc);

        context.builder.createCondBr(
            context.builder.createICmpNE(
                memory,
                llvm.ConstantPointerNull.get(type)
            ),
            done,
            outOfMemory
        );

        context.builder.setInsertionPoint(outOfMemory);
        generateTrap('internal allocation out of memory.', null, node, context);
        context.builder.createBr(done);

        context.builder.setInsertionPoint(done);
    }

    return memory;
}

/**
 * Frees an object in a given context.
 * @param {llvm.Value} obj The LLVM value to free.
 * @param {LLVMContext} context
 * @return {Value} the created call
 */
export function free(obj, context) {
    const backend = context.backend;

    // Get malloc
    let free = backend.module.getOrInsertFunction(
        'free',
        llvm.FunctionType.get(
            llvm.Type.getVoidTy(backend.context),
            [llvm.Type.getInt8PtrTy(backend.context)],
            false
        )
    );

    return context.builder.createCall(
        free.callee,
        [obj]
    );
}

export default class MemoryManager {
    /**
     * @param {LLVMContext} context
     */
    static getRcWrapperTy({ backend: { module, context }}) {
        const name = 'vsl.rcty';
        let ty = module.getTypeByName(name);
        if (ty) return ty;

        // basically size_t
        const intTy = module.dataLayout.getIntPtrType(context, 0);

        // basically void*
        const voidPtr = llvm.Type.getInt8PtrTy(context);

        ty = llvm.StructType.create(context, name);

        ty.setBody([
            intTy,
            voidPtr
        ]);

        return ty;
    }

    /**
     * Reverse ref to the scope declaring this
     * @param {Scope} scope
     * @param {LLVMContext} context - LLVM context of the instance in which this
     *                              is created.
     */
    constructor(scope, context) {
        /** @type {llvm.IRBuilder} */
        this.builder = context.builder;

        /** @type {llvm.LLVMContext} */
        this.context = context.backend.context;

        /** @type {llvm.Module} */
        this.module = context.backend.module;

        /** @type {LLVMContext} */
        this.vslContext = context;

        /** @type {Scope} */
        this.scope = scope;

        /**
         * All managed refs
         * @param {TrackedItem[]}
         */
        this.items = [];
    }

    /**
     * Declares a new reference to an llvm.Value. This will returned the wrapped
     *  object.
     * @param {llvm.Value} value
     * @param {Object} opts
     * @param {Boolean} [opts.isFirst=false] If this is a raw value (not a wrapped RC)
     * @param {Boolean} [opts.isRetained=true] See {@link ManagedItem}
     * @return {llvm.Value} wrapped RC'd object
     */
    uprefValue(value, { isFirst = false, isRetained = true } = {}) {
        let rcWrapper;

        if (isFirst) {
            const wrapperTy = MemoryManager.getRcWrapperTy(this.vslContext);

            rcWrapper = this.builder.createBitCast(
                malloc(this.module.dataLayout.getTypeStoreSize(wrapperTy)),
                wrapperTy
            );

            const rc = this.builder.createInBoundsGEP(
                rcWrapper,
                [
                    llvm.ConstantInt.get(this.context, 0),
                    llvm.ConstantInt.get(this.context, 0)
                ]
            );

            // If it is retained we say we want a ref, otherwise we'll toss.
            if (isRetained) {
                this.builder.createStore(llvm.ConstantInt.get(this.context, 0), rc);
            } else {
                this.builder.createStore(llvm.ConstantInt.get(this.context, 1), rc);
            }

            this.builder.createStore(
                value,
                this.builder.createInBoundsGEP(
                    rcWrapper,
                    [
                        llvm.ConstantInt.get(this.context, 0),
                        llvm.ConstantInt.get(this.context, 1)
                    ]
                )
            )
        } else {
            rcWrapper = value;

            const rc = this.builder.createInBoundsGEP(
                obj,
                [
                    llvm.ConstantInt.get(this.context, 0),
                    llvm.ConstantInt.get(this.context, 0)
                ]
            );

            this.builder.createStore(
                this.builder.createAdd(
                    this.builder.load(rc),
                    llvm.ConstantInt.get(this.context, 1)
                ),
                rc
            );
        }

        const trackedInstance = new TrackedItem(rcWrapper, {
            noOwnership: !isRetained
        });

        this.items.push(trackedInstance);

        return trackedInstance;
    }

    /**
     * Obtains the value for wrapped RC'd obj
     * @param {TrackedItem|llvm.Value} ptr
     * @return {llvm.Value} Gets the unwrapped val.
     */
    getValue(ptr) {
        if (ptr instanceof TrackedItem) {
            this.getValue(ptr.ptr);
        } else {
            return this.builder.createLoad(
                this.builder.createInBoundsGEP(
                    ptr,
                    [
                        llvm.ConstantInt.get(this.context, 0),
                        llvm.ConstantInt.get(this.context, 1)
                    ]
                )
            )
        }
    }

    /**
     * Call this to generate the deinit code for the whole block.
     */
    downrefScope() {
        // TODO: ...
    }
}

export class TrackedItem {
    /**
     * Creates a tracked memory item
     * @param {llvm.Value} ptr represents the physical pointer to the value that
     *                         we want to manage. This should be the *wrapped*
     *                         object.
     * @param {Object} opts
     * @param {boolean} opts.noOwnership If the object is not retained and
     *                                   ownership is passed.
     */
    constructor(ptr, { noOwnership = false } = {}) {
        /** @type {llvm.Value} */
        this.ptr = ptr;

        /**
         * If the object is not retained by the parent scope. Any indirect
         * contains may retain and control this value.
         * @type {boolean}
         */
        this.noOwnership = noOwnership;
    }
}
