/**
 * An error representing LLVM-specific or compiler-time errors.
 */
export default class BackendError {
    /**
     * Creates new BackendError
     * @param  {string} message Human readable error message
     * @param  {Node} node node which error happened on
     */
    constructor(message, node) {
        /** @type {string} */
        this.message = message;
        
        /** @type {Node} */
        this.node = node;
    }
}
