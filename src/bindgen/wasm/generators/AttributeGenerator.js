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

    const variableType = node.readonly ? 'const' : 'let';

    return `public ${variableType} ${attributeName}: ${typeName}`;
}
