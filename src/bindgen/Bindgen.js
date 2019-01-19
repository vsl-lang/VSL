/**
 * Represents a bindgen type
 * @abstract
 */
export default class Bindgen {
    /**
     * Bindgen
     * @param {string[]} sources path list of all sources
     * @param {Object} output
     * @param {string} output.outputDirectory - The dir of output
     * @param {string} output.outputName - Root name of output item
     * @param {Object} [options={}] - Additional object-specific options
     */
    constructor(sources, { outputDirectory, outputName }, options = {}) {
        /**
         * List of sources
         * @type {string[]}
         */
        this.sources = sources;

        /**
         * Dir of output
         * @type {string}
         */
        this.outputDirectory = outputDirectory;

        /**
         * Root name of output item
         * @type {string}
         */
        this.outputName = outputName;

        /**
         * Additional object-specific options
         * @type {Object}
         */
        this.options = options;
    }

    /**
     * Dispatches bindgen if applicable
     * @param {Object} [options={}]
     * @param {boolean} [options.force=false] - If to force build even if
     *                                        already built.
     */
    async dispatch({ force = false } = {}) {
        if (await this.alreadyBuilt() && !force) {
            return;
        }

        await this.run();
    }

    /**
     * Determines if output files are already prepared.
     * @return {boolean}
     * @abstract
     * @async
     */
    async alreadyBuilt() { return false; }

    /**
     * Runs bindgen unconditionally. It is recommended to use
     * {@link Bindgen#dispatch}
     * @async
     * @abstract
     */
    async run() {}
}
