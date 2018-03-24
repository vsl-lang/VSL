import * as llvm from 'llvm-node';
import getFunctionName from './getFunctionName';
import toLLVMType from './toLLVMType';
import { getTypeOffset } from './layoutType';

/**
 * Obtains the default initializer for a class.
 * @param {ScopeTypeItem} ty the VSL we are initializing.
 * @param {LLVMContext} context
 * @param {Function} regen Regeneration function
 */
export default function getDefaultInit(ty, context, regen) {
    const id = `iDF${ty.uniqueName}`;
    const backend = context.backend;

    const llvmTy = toLLVMType(ty, backend);

    let existingFunc = backend.module.getFunction(id);
    if (existingFunc) return existingFunc;

    // NoRecurse InlineHint
    const init = llvm.Function.create(
        llvm.FunctionType.get(
            llvmTy,
            [llvmTy],
            false
        ),
        llvm.LinkageTypes.ExternalLinkage,
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

    // Run default init for all fields with default value
    for (let i = 0; i < ty.subscope.aliases.length; i++) {
        const defaultField = ty.subscope.aliases[i];
        const fieldNode = defaultField.source;
        if (fieldNode?.value) {
            let fieldValue = regen('value', fieldNode, defaultCtx);
            let indexOfField = getTypeOffset(ty, defaultField);

            let storeInst = defaultBuilder.createStore(
                fieldValue,
                defaultBuilder.createInBoundsGEP(
                    self,
                    [
                        // Deref the field itself
                        llvm.ConstantInt.get(backend.context, 0),

                        // The field we want
                        llvm.ConstantInt.get(backend.context, indexOfField)
                    ]
                )
            );
        }
    }

    // Return node itself
    defaultBuilder.createRet(self);
    return init;
}
