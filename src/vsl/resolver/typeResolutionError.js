/**
 * Emitted by the type resolver to indicate that there was some bork where the
 * types could not be deducted. Stores node position and also attempted
 * candidates if possible. Reference `node.typeCandidates` and see the
 * {@link Node} class for more info on how to access information for generating
 * an error.
 */
export default class TypeResolutionError extends Error {
    /**
     * Creates an error given node and message. If you are in a resolver we
     * reccomend using the `#emit(message:)` function which will automatically
     * handle all of this stuff.
     */
    constructor(message: string, node: Node) {
        super(message);

        this.name = "TypeResolutionError";
        this.node = node;
    }
}
