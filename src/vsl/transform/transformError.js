/**
 * Use this to specify an error occured within a `Transformation`. This allows
 * you to pass the node so the CLI or others can obtain location data and show
 * exactly where the error occured.
 *
 */
export default class TransformError {
    /**
     * @param {string} message - error message
     * @param {Node} node - erroring node
     */
    constructor(message, node, ref) {
        /** @type {string} */
        this.message = message;

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
