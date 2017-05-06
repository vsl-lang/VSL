/**
 * Use this to specify an error occured within a `Transformation`. This allows
 * you to pass the node so the CLI or others can obtain location data and show
 * exactly where the error occured.
 * 
 */
export default class TransformError extends Error {
    constructor(message, node) {
        super(message);
        this.name = 'Transform Error';
        this.node = node;
    }
}