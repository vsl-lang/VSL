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
    }
}
