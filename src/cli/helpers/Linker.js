import commandExists from 'command-exists';

/**
 * @typedef {Object} LinkageOptions
 * @property {string} arch - The achitecture linking to
 * @property {Triple} triple - The target triple
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
     * @param {string[]} names Names of commands to look for.
     * @param {string[]} defaultArgs Default args
     */
    constructor(names) {
        /** @type {string[]} */
        this.names = names;
    }

    /**
     * Additional checks to see if installation would work.
     * @return {boolean}
     */
    async check() { return true; }

    /**
     * Command name for this linker.
     * @return {string}
     */
    async getCommandName() {
        console.log('Z', this.names);
        for (let i = 0; i < this.names.length; i++) {
            console.log('X', i, this.names[i]);
            if (await commandExists(this.names[i])) {
                console.log('XZ', i, this.names[i]);
                return this.names[i];
            }
            console.log('XE', i, this.names[i]);
        }

        return null;
    }

    /**
     * Returns list of linkage args for options.
     * @param  {LinkageOptions}  options
     * @return {Promise}         Resolves to array of options
     */
    async getArgumentsForLinkage(options) {
        throw new TypeError('Must override Linker#getArgumentsForLinkage(options:)');
    }
}
