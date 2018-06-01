import * as llvm from 'llvm-node';

/**
 * Modification of llvm's getOrInsertFunction that will let us modify linkage
 * @param {LLVMContext} context - context object
 * @param {string} funcName - function name
 * @param {llvm.FunctionType} funcTy - Function with desired linkage types etc.
 * @param {?llvm.LinkageType} linkageType - the linkage type
 * @return {llvm.Function} the final function
 */
export default function getOrInsertFunction(context, funcName, funcTy, linkageType = llvm.LinkageTypes.InternalLinkage) {
    let func = context.module.getFunction(funcName);
    if (func) return func;

    // Otherwise we have to create it
    func = llvm.Function.create(funcTy, linkageType, funcName, context.module);
    return func;
}
