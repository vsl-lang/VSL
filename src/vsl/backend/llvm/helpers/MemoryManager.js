import * as llvm from 'llvm-node';
import generateTrap from './generateTrap';
import getOrInsertFunction from './getOrInsertFunction';

/**
 * Tool for memory managing LLVM stuff. Abstraction point for alloc/dealloc.
 * `size` should be from `backend.module.dataLayout.getTypeStoreSize(type.elementType)``
 *
 * @param {number} size - Size in bytes of memory to alloc.
 * @param {llvm.Type} type - The type that allocation should return.
 * @param {Node} node - The node triggering allocation.
 * @param {LLVMContext} context
 */
export function alloc(size, type, node, context) {
    // Get malloc
    let malloc = getOrInsertFunction(
        context,
        'malloc',
        llvm.FunctionType.get(
            llvm.Type.getInt8PtrTy(context.ctx),
            [llvm.Type.getInt64Ty(context.ctx)],
            false
        ),
        llvm.LinkageTypes.ExternalLinkage
    );

    const rawMemoryPtr = context.builder.createCall(
        malloc,
        [llvm.ConstantInt.get(context.ctx, size, 64)]
    );

    const memory = context.builder.createBitCast(rawMemoryPtr, type);

    // const lifetimeStart = getOrInsertFunction(
    //     context,
    //     'llvm.lifetime.start',
    //     llvm.FunctionType.get(llvm.Type.getVoidTy(context.ctx), [
    //         llvm.Type.getInt64Ty(context.ctx),
    //         llvm.Type.getInt8PtrTy(context.ctx)
    //     ], false),
    //     llvm.LinkageTypes.ExternalLinkage
    // );

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

        context.builder.setInsertionPoint(done);
    }

    // context.builder.createCall(lifetimeStart, [
    //     llvm.ConstantInt.get(context.ctx, size, 64),
    //     rawMemoryPtr
    // ]);

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
     * Obtains a probable upper limit on stack alignment size in bytes.
     * @type {number}
     */
    get recommendedStackAlignmentLimit() {
        return 16;
    }

    /**
     * Determines if an object is small enough to be effectively moved to stack.
     * Combine this with checking the lifetime to see if this is an applicable
     * optimization. Additionally count the amount of instances where this would
     * occur. This optimization is encapsualated in the MemoryManager
     * @param {llvm.Type} type - If the type is small enough to be on stack
     * @return {boolean}
     */
    isOptimalStackSized(type) {
        const typeAlignment = this.context.dataLayout.getPrefTypeAlignment(type);
        return typeAlignment < this.recommendedStackAlignmentLimit;
    }

    /**
     * Reverse ref to the scope declaring this
     * @param {Scope} scope
     * @param {LLVMContext} context - LLVM context of the instance in which this
     *                              is created.
     */
    constructor(scope, context) {
        /** @type {LLVMContext} */
        this.context = context;

        /** @type {Scope} */
        this.scope = scope;

        /**
         * The number of existing allocation locations optimized to stack.
         * @type {number}
         */
        this.existingAllocationCount = 0;
    }

}
