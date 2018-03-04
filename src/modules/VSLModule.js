/**
 * Represents the actual module and the values. DO NOT directly modify ANY value
 */
export default class VSLModule {
    /**
     * Empty VSLModule, use {@link Module} to create one of these.
     */
    constructor() {
        /**
         * The name of the module.
         * @type {string}
         */
        this.name = null;

        /**
         * The description of the module
         * @type {string}
         */
        this.description = null;

        /**
         * The output type, one of LLVM's targets
         * @type {string}
         */
        this.target = 'native';

        /**
         * falsey if stdlib *should not* be loaded, otherwise is the name of the
         * stdlib to load.
         * @type {string}
         */
        this.stdlib = true;

        /**
         * Raw list of all source files. This is a list with all globs and such
         * expanded. Paths should be absolute
         *
         * @type {string[]}
         */
        this.sources = [];

        /**
         * Linker arguments if provided
         * @param {string[]}
         */
        this.linkerArgs = [];
    }
}
