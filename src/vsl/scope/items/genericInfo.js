/**
 * Represents info about a generic class. You can then reference a given
 * parameter with this.
 */
export default class GenericInfo {
    /**
     * @param {Object} opts
     * @param {GenericParameterItem[]} opts.parameters
     */
    constructor({ parameters }) {
        /** @type {GenericParameterItem[]} */
        this.parameters = parameters;

        /**
         * Caches specializations.
         * @type {Array<GenericParameterItem[], ScopeGenericSpecialization>}
         */
        this.existingSpecializations = [];
    }

    /**
     * Specifies if this generic info describes a type that is generic
     * @type {boolean}
     */
    get isGeneric() {
        return this.parameters.length > 0;
    }
}
