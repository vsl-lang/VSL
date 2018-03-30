/**
 * Emitted by documentation generator classes
 */
export default class DocError {
    /**
     * Creates an error given node and message. If you are in a resolver we
     * reccomend using the `#emit(message:)` function which will automatically
     * handle all of this stuff.
     *
     * @param {string} message - What the error message should say
     * @param {Node} node - Where this occured
     */
    constructor(message: string, node: Node) {
        /** @type {string} */
        this.message = message;

        /** @type {string} */
        this.name = "Documentation Generator Error";

        /** @type {Node} */
        this.node = node;
    }
}
