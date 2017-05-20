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
     */
    constructor(message, node) {
        super(message);
        
        /** @private */
        this.name = 'Transform Error';
        
        /** @private */
        this.node = node;
    }
}