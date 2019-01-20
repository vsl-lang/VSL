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
        .map(member => {
            const memberName = bindgen.formatIdentifier(member.name);
            const memberType = bindgen.formatType(member.idlType);

            const memberDefaultValueComment = member.default ? ` /* = ${member.default.value} */` : ``;

            return `${memberName}: ${memberType}${memberDefaultValueComment}`
        })
        .join(",\n");

    return `public typealias ${tupleName} = {
${bindgen.indent(args)}
}

`
}
