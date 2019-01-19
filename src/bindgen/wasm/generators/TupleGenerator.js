/**
 * Generates interface node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function TupleGenerator(node, bindgen) {
    const tupleName = bindgen.formatIdentifier(node.name);

    const args = node.members
        .filter(member => member.type === 'field')
        .map(member => `${bindgen.formatIdentifier(member.name)}: ${bindgen.formatType(member.idlType)}`);

    return `public typealias ${tupleName} = {
${args.map(arg => `    ${arg}`).join("\n")}
}

`
}
