/**
 * Given a generic type, this generates the mangled name.
 * 
 * @param {string} source - The source type ID
 * @param {string[]} args - The argument types.
 */
export default function generateGenericMangle(source: string, args: string[]) {
    return source +"<" + args.join(",") + ">";
}