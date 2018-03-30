/**
 * Generates a type
 * @param {ScopeTypeItem}
 * @return {Object}
 */
export default function genType(type) {
    // Get module of type
    let module = null; // Default is currect module
    if (type.source) {
        let elem = type.source;

        while (elem.parentNode) {
            elem = elem.parentNode;

            if (elem.stream?.owningGroup) {
                module = elem.stream.owningGroup.metadata.name;
            }
        }
    }

    return {
        ref: type.rootId,
        module: module
    }
}
