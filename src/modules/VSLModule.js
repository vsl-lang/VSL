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
         * Valid semver version
         * @type {String}
         */
        this.version = '1.0.0';

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

        // List of sources in format [matchingSources, filterExpr]
        this._sources = [];

        /**
         * Linker arguments if provided
         * @type {Object}
         * @property {string[]} libraries - List of libraries
         */
        this.linker = {
            libraries: []
        };

        /**
         * Options for doc generator
         * @type {Object}
         */
        this.docopts = {};
    }

    /**
     * Returns all sources matching filter
     * @param {Object} filter
     * @return {string[]} array of absolute paths.
     */
    getSources(filter) {
        const paths = [];

        for (const [matchingSources, expr] of this._sources) {
            if (expr.test(filter)) {
                paths.push(...matchingSources);
            }
        }

        return paths;
    }
}
