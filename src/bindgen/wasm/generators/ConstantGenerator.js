/**
 * Generates constant node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function ConstantGenerator(node, bindgen) {
    const attributeName = node.name;
    const type = node.idlType;
    const typeName = bindgen.formatType(type);

    return `public static const ${attributeName}: ${typeName} = ${node.value.value}`;
}
