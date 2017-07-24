const DEFAULT_INT_SIZE = '32';

/**
 * Returns the LLVM repr of a type.
 *
 * @param {LLIR} backend - The backend object which references or deals with the
 *                       type name. We use this to add a `type Foo = ...` decl.
 *                       to top-level
 * @param {ScopeItem} type Scope item object (generally a candidate).
 * @return {string} String representing the typename
 */
export default function typeName(backend, type) {
    let name = type.rootId,
        intName;
    
    if (name)
    
    if ((intName = /^U?Int(8|16|32|64|128)?/.exec(name))) {
        return "i" + (intName[1] || DEFAULT_INT_SIZE);
    } else if (name === "Pointer") {
        return "i8*";
    } else {
        return name + "*";
    }
}
