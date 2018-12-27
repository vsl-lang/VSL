import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import { Key } from '../LLVMContext'
import tryGenerateCast from './tryGenerateCast';
import { getTypeOffset, getVTableOffset } from './layoutType';
import { getMethodOffsetInVTable } from './VTable';
import getFunctionType from './getFunctionType';
import getFunctionInstance from './getFunctionInstance';

/**
 * Obtains the default initializer for a class. This initializer only inits the
 * DEFAULT props.
 *
 * The default init will initialize the superclass and then the current class
 * if exists.
 *
 * @param {ScopeTypeItem} ty the VSL we are initializing.
 * @param {LLVMContext} context
 * @param {Function} regen Regeneration function
 * @return {llvm.Function} the function
 */
export default function getDefaultInit(ty, context, regen) {
    const id = `F${ty.uniqueName}.init`;
    const backend = context.backend;

    const llvmTy = toLLVMType(ty, context);

    let existingFunc = backend.module.getFunction(id);
    if (existingFunc) return existingFunc;

    // NoRecurse InlineHint
    const init = llvm.Function.create(
        llvm.FunctionType.get(
            llvm.Type.getVoidTy(context.ctx),
            [llvmTy],
            false
        ),
        llvm.LinkageTypes.PrivateLinkage,
        id,
        backend.module
    );

    init.addFnAttr(llvm.Attribute.AttrKind.InlineHint);
    init.addFnAttr(llvm.Attribute.AttrKind.NoRecurse);

    let defaultInitBlock = llvm.BasicBlock.create(
        backend.context,
        'entry',
        init
    );

    // Builder for default init
    let defaultBuilder = new llvm.IRBuilder(defaultInitBlock);

    const self = init.getArguments()[0];

    const defaultCtx = context.bare();
    defaultCtx.builder = defaultBuilder;
    defaultCtx.parentFunc = init;
    defaultCtx.typeContext = context.typeContext;

    if (ty.hasSuperClass) {
        const superclassInit = getDefaultInit(ty.superclass, context, regen);
        defaultBuilder.createCall(
            superclassInit,
            [
                defaultBuilder.createInBoundsGEP(
                    self,
                    [
                        llvm.ConstantInt.get(backend.context, 0),
                        llvm.ConstantInt.get(backend.context, 0)
                    ]
                )
            ]
        );
    }

    // Run default init for all fields with default value
    for (let i = 0; i < ty.subscope.aliases.length; i++) {
        const defaultField = ty.subscope.aliases[i];
        const fieldNode = defaultField.source;
        if (fieldNode?.value) {
            let fieldValue = regen('value', fieldNode, defaultCtx);

            let storeInst = defaultBuilder.createStore(
                fieldValue,
                getTypeOffset(self, ty, defaultField, defaultCtx)
            );
        }
    }

    // Set vtable items
    for (const dynMethod of ty.dynamicMethods()) {
        // Get the vtable this belongs to
        const virtualMethod = dynMethod.virtualParentMethod;
        const vtableClass = virtualMethod.owner.owner.selfType.contextualType(ty.getTypeContext());

        const methodVTablePtr = getMethodOffsetInVTable(
            getVTableOffset(
                tryGenerateCast(
                    self,
                    ty,
                    vtableClass,
                    defaultCtx
                ),
                vtableClass,
                defaultCtx
            ),
            vtableClass,
            virtualMethod,
            defaultCtx
        );

        const newCtx = context.bare();
        newCtx.typeContext = context.typeContext.merge(ty.getTypeContext());

        const methodImplementation = getFunctionInstance(dynMethod, newCtx, regen);
        defaultCtx.builder.createStore(
            defaultCtx.builder.createBitCast(
                methodImplementation,
                getFunctionType(virtualMethod, defaultCtx).getPointerTo()
            ),
            methodVTablePtr
        );
    }

    defaultBuilder.createRetVoid();

    return init;
}
