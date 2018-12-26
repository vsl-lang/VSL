import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import isInstanceCtx from './isInstanceCtx';

/**
 * Gets type of a function
 * @param {ScopeFuncItem} scopeItem
 * @param {LLVMContext} context - Carries type context if generic.
 */
export default function getFunctionType(scopeItem, context) {
    const typeContext = context.typeContext;

    let returnType;
    if (scopeItem.returnType) {
        returnType = toLLVMType(scopeItem.returnType.selfType.contextualType(typeContext), context);
    } else {
        returnType = llvm.Type.getVoidTy(context.ctx);
    }

    const argTypes = scopeItem.args.map(
        arg => toLLVMType(arg.type.selfType.contextualType(typeContext), context)
    );

    // Where the physical args start
    const hasSelfParameter = isInstanceCtx(scopeItem);

    // If this _is_ a method (i.e. instance function), we'll want to make
    //  sure we add `self` as the first argument. Also should not be static
    if (hasSelfParameter) {
        const selfType = toLLVMType(scopeItem.owner.owner.selfType.contextualType(typeContext), context);
        argTypes.unshift(
            selfType
        );
    }

    // Get the function type by mapping each arg ref to a respective type.
    return llvm.FunctionType.get(
        returnType,
        argTypes,
        false
    );
}
