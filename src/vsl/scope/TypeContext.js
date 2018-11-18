/**
 * @typedef {Map<GenericParameterItem, ScopeTypeItem>} GenericContext
 */

/**
 * Represents a type that is defined by context for example generic parameters.
 */
export default class TypeContext {

    /**
     * Creates a type context
     * @param {Object} opts
     * @param {GenericContext} genericParameters - The types of generic params.
     */
    constructor({ genericParameters }) {
        /** @private */
        this.genericParameters = genericParameters;
    }

    /**
     * Returuns the type that a generic paramter should be in context.
     * @param {GenericParameterItem} - genericParameterItem
     * @return {?ScopeTypeItem} `null` if no type for param.
     */
    getTypeForGenericParameter(genericParameterItem) {
        return this.genericParameters.get(genericParameterItem) || null;
    }
}
