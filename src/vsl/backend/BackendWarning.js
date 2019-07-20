/**
 * Represents a warning emitted by backend
 */
export default class BackendWarning {
    /**
     * @param {string} message Message of the wraing
     * @param {Node} node The node the waring is associated with
     */
    constructor(message, node) {
        /** @type {string} */
        this.message = message;

        /** @type {Node} */
        this.node = node;

        /** @type {CompilationStream} */
        this.stream = null;
    }
}
