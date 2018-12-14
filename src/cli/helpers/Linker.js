/**
 * @typedef {Object} LinkageOptions
 * @property {string} arch - The achitecture linking to
 * @property {string[]} files - Path string array to object files.
 * @property {string[]} libraries - libraries to link
 * @property {string} output - Output path
 * @property {ErrorManager} errorManager - Error manager
 */

/**
 * Info about a linker
 */
export default class Linker {
    /**
     * @param {string} name Name of constructor command
     * @param {string[]} defaultArgs Default args
     */
    constructor(name) {
        /** @type {string} */
        this.name = name;
    }

    /**
     * Command name for this linker.
     * @return {string}
     */
    get commandName() { return this.name; }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {
        throw new TypeError('Must override Linker#getArgumentsForLinkage(options:)');
    }
}
