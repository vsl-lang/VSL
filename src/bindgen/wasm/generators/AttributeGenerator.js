/**
 * Generates attribute node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function AttributeGenerator(node, bindgen) {
    const attributeName = node.name;
    const type = node.idlType;
    const typeName = bindgen.formatType(type);

    const isConstant = node.readonly;

    return `public let ${attributeName}: ${typeName} {
    return ${typeName}::self.dispatchAccess(target: "${attributeName}")
}`;
}
