/**
 * Info about a linker
 */
export default class Linker {
    /**
     * @param {string} name Name of constructor command
     * @param {string[]} defaultArgs Default args
     */
    constructor(name, defaultArgs = []) {
        /** @type {string} */
        this.name = name;

        /** @type {string[]} */
        this.defaultArgs = defaultArgs;
    }
}
