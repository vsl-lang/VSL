/**
 * Use this to specify an error occured within a `Transformation`. This allows
 * you to pass the node so the CLI or others can obtain location data and show
 * exactly where the error occured.
 *
 */
export default class TransformError extends Error {
    /**
     * @param {string} message - error message
     * @param {Node} node - erroring node
     * @param {Object} ref - Specific error item (from errors.js)
     */
    constructor(message, node, ref) {
        super(message);

        /** @type {string} */
        this.name = 'Transform Error';

        /** @type {Node} */
        this.node = node;
        
        /**
         * @type {?Object}
         */
        this.ref = ref;
    }
}
