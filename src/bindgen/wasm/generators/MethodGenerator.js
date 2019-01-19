/**
 * Generates method node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function MethodGenerator(node, bindgen) {
    if (!node.body) return "/* skipped method */";

    const functionName = node.body.name.value;
    const returnType = bindgen.formatType(node.body.idlType);

    const args = node.body.arguments
        .map(({ name, idlType: type }) => `${bindgen.formatIdentifier(name)}: ${bindgen.formatType(type)}`)
        .join(", ");

    return `public func ${functionName}(${args}) -> ${returnType} {}`;
}
