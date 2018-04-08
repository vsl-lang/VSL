import t from '../../../parser/nodes';
import LLVMContext from '../LLVMContext';

/**
 * Gets the name for a {@link ScopeFuncItem}
 * @param {ScopeFuncItem} func - Function scope item/
 * @return {string}
 */
export default function getFunctionName(func) {
    let statements = func.source?.statements;

    if (statements instanceof t.ExternalMarker) {
        return statements.rootId;
    } else {
        if (func.rootId === "main") return "main";
        return func.uniqueName;
    }
}

export function getFunctionInstance(func, regen, context) {
    const node = func.source;
    return regen(node.relativeName, node.parentNode, context)
}
