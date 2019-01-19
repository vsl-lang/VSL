import ModuleInterface from './ModuleInterface';

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

        /**
         * Root path of module
         * @type {string}
         */
        this.rootPath = "";

        // List of sources in format [glob, filterExpr]
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
         * Bindgens
         * @type {Bindgen[]}
         */
        this.bindgens = [];

        /**
         * Dir for cache
         * @type {?string}
         */
        this.cacheDirectory = null;

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
    async getSources(filter) {
        const paths = [];

        for (const [sourcesGlob, expr] of this._sources) {
            if (expr.test(filter)) {
                let files = await ModuleInterface.shared.glob(
                    sourcesGlob,
                    this.rootPath
                );

                paths.push(...files);
            }
        }

        return paths;
    }
}
