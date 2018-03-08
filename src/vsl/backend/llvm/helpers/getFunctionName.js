import t from '../../../parser/nodes';

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
