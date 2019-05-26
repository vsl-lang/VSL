import ScopeGenericSpecialization from '../../../scope/items/scopeGenericSpecialization';

/**
 * Validates entry name
 * @return {Boolean} if valid
 */
export function isValidEntryName(name) {
    return name === "main";
}

/**
 * Boilerplate for creating the entry function
 * @param {ScopeFuncItem} scopeItem
 * @return {boolean} if valid.
 */
export function isValidEntryTy(scopeItem, context) {
    return (
        scopeItem.returnType ?
            false :
        scopeItem.args.length === 2 ?
            scopeItem.args[0].type.mockType === "i32" &&
            scopeItem.args[1].type.mockType === "pointer8" :
        scopeItem.args.length === 1 ?
            // scopeItem.args[0].type instanceof ScopeGenericSpecialization ?
            //     scopeItem.args[0].type.parameters[0].isLocalString === '' *
            false :
        scopeItem.args.length === 0
    );
}
