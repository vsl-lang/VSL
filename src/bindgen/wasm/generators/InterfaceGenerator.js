import AttributeGenerator from './AttributeGenerator';
import ConstantGenerator from './ConstantGenerator';
import MethodGenerator from './MethodGenerator';

function isPublic(node) {
    if (node.name === 'Window') return true;

    const items = node.extAttrs?.items || [];
    return items.some(item => item.name === 'Exposed' && (
        item.rhs &&
            item.rhs.value === 'Window' || (
                item.rhs.value instanceof Array &&
                item.rhs.value.some(givenValue => givenValue.value === 'Window'))
    ));
}

/**
 * Generates interface node
 * @param {Object} node - AST node
 * @param {WASMBindgen} bindgen - Bindgen
 * @return {string} VSL string
 */
export default function InterfaceGenerator(node, bindgen) {
    const className = bindgen.formatIdentifier(node.name);

    // If it is even a publically exposed interface.
    const isPublicItf = isPublic(node);
    if (!isPublicItf) return "";

    const mixinProps = bindgen.mixinMap.get(node.name) || [];
    const allMembers = node.members.concat(...mixinProps.map(mixin => mixin.value))

    const items = [];
    for (let i = 0; i < allMembers.length; i++) {
        const member = allMembers[i];
        switch (member.type) {
            case "attribute":
                items.push(AttributeGenerator(member, bindgen));
                break;

            case "const":
                items.push(ConstantGenerator(member, bindgen));
                break;

            case "operation":
                items.push(MethodGenerator(member, bindgen));
                break;

            case "iterable":
                // VSL doesn't support iterables yet
                continue;

            default:
                continue;
        }
    }

    // Inheritance string
    const inheritance = node.inheritance ?
        bindgen.formatIdentifier(node.inheritance.name) :
        'JSValue';

    return `@mock(ui32)
@dynamic(false)
public class ${className}: ${inheritance} {
    private init() { super.init() }

${bindgen.indent(items.join("\n"))}
}

`
}
