import t from '../../../parser/nodes';
import LLVMContext from '../LLVMContext';

/**
 * Gets the name for a {@link ScopeFuncItem}.
 * @param {ScopeFuncItem} func - Function scope item.
 * @param {?TypeContext} typeContext - Type context for function.
 * @return {string}
 */
export function getFunctionName(func, typeContext) {
    let statements = func.source?.statements;

    if (statements instanceof t.ExternalMarker) {
        return statements.rootId;
    } else if (func.foreignName) {
        return func.foreignName;
    } else {
        if (func.rootId === "main") return "main";
        return func.uniqueName + (func.isGeneric && typeContext ? typeContext.getMangling() : "");
    }
}

/**
 * Returns the function as an LLVM object.
 * @param {ScopeFuncItem} func
 * @param {LLVMContext} context - You probably want to give a clean context
 *                              using `context.bare()`
 * @param {Function} regen
 * @return {llvm.Function}
 */
export default function getFunctionInstance(func, context, regen) {
    const node = func.source;
    return regen(node.relativeName, node.parentNode, context)
}
