/**
 * @typedef {Object} ArgumentMetadata
 * @property {string} publicName - Public name
 * @property {?string} privateName - private name or `null`
 * @property {ScopeTypeItem} type - parameter type
 * @property {boolean} isOptional - If method is optional
 */

/**
 * Obtains metadata on a given function.
 * @param {ScopeFuncItem} func - Function
 * @return {Object}
 * @property {string} name - Name of function
 * @property {string} mangling - Mangled name
 * @property {string} description - Description of function
 * @property {boolean} isStatic - Name of function
 * @property {ArgumentMetadata[]} args
 * @property {ScopeTypeItem} returnType - Return type
 */
export default function getMethodMetadata(method) {
    const name = method.rootId;
    const returnType = method.returnType;
    const isStatic = !!method?.owner.isStaticContext;
    const description = method.source?.precedingComments || [];
    const args = method.args.map(arg => ({
        publicName: arg.name,
        privateName: null,
        type: arg.type,
        isOptional: arg.optional
    }));

    return {
        name: method.rootId,
        mangling: method.uniqueName,
        isStatic: isStatic,
        description: description,
        args: args,
        returnType: method.returnType
    }
}
