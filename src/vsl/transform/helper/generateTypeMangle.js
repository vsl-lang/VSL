/**
 * Given a generic type, this generates the mangled name.
 * 
 * @param {string[]} args - The argument types.
 * @param {boolean} optional - Whether the type is optional
 */
export default function generateTypeMangle(args: string[], optional: boolean) {
    let root = args.join(".");
    if (optional) {
        return `Optional<${root}>`;
    } else {
        return root;
    }
}