/**
 * @typedef {Map<GenericParameterItem, ScopeTypeItem>} GenericContext
 */

/**
 * Represents a type that is defined by context for example generic parameters.
 */
export default class TypeContext {

    /**
     * Creates an empty type context
     * @return {TypeContext}
     */
    static empty() {
        return new TypeContext({
            genericParameters: new Map()
        })
    }

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

    /**
     * Returns true if no contextual information
     * @return {boolean}
     */
    isEmpty() {
        return this.genericParameters.size === 0;
    }

    /**
     * Adds a mangling suffix to this type context
     * @return {string}
     */
    getMangling() {
        if (this.isEmpty()) {
            return "";
        } else {
            return `.generic.${
                [...this.genericParameters]
                    .map(([_, type]) => type.uniqueName)
            }`;
        }
    }

    /**
     * Returns human-readable description of type context.
     * @return {string}
     */
    toString() {
        return [...this.genericParameters]
            .map(([key, value]) => `${key} => ${value}`).join("; ")
    }

    /**
     * Returns a new type context with current and another merged. Immutable
     * @param {TypeContext} otherContext
     * @return {TypeContext}
     */
    merge(otherContext) {
        return new TypeContext({
            genericParameters: new Map([
                ...this.genericParameters,
                ...otherContext.genericParameters
            ])
        })
    }
}
