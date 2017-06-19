/**
 * An error emitted by a scope usually to indicate that a variable could not
 * be resolved or such.
 */
export default class ScopeError extends Error {
    /**
     * Creates an error given node and message. If you are in a resolver we
     * reccomend using the `#emit(message:)` function which will automatically
     * handle all of this stuff.
     */
    constructor(message: string, node: Node) {
        super(message);

        this.name = "ScopeError";
        this.node = node;
    }
}
