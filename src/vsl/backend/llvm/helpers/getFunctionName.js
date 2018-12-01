import t from '../../../parser/nodes';

/**
 * Gets the name for a {@link ScopeFuncItem}.
 * @param {ScopeFuncItem} func - Function scope item.
 * @param {?TypeContext} typeContext - Type context for function.
 * @return {string}
 */
export default function getFunctionName(func, typeContext) {
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
