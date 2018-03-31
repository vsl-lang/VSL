/**
 * Generates HTML from a source JSON
 */
export default class HTMLGenerator {
    /**
     * This creates a new generator instance under control from a generator.
     * @param {HTMLGen} generator
     */
    constructor(generator) {
        /** @type {HTMLGen} */
        this.generator = generator;
    }

    /**
     * Generates an item
     * @param {Object} item any
     */
    async generate(item) {
        throw new TypeError('must override HTMLGenerator#generate');
    }
}
