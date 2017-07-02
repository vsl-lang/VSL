/**
 * Emitted by the type resolver to indicate that there was some bork where the
 * types could not be deducted. Stores node position and also attempted
 * candidates if possible. Reference `node.typeCandidates` and see the
 * {@link Node} class for more info on how to access information for generating
 * an error.
 */
export default class TypeResolutionError {
    /**
     * Creates an error given node and message. If you are in a resolver we
     * reccomend using the `#emit(message:)` function which will automatically
     * handle all of this stuff.
     */
    constructor(message: string, node: Node, ref: Object) {
        /** @type {string} */
        this.message = message;
        
        /** @type {string} */
        this.name = "Type Resolution Error";
        
        /** @type {Node} */
        this.node = node;
        
        /**
         * @type {?Object}
         */
        this.ref = ref;
    }
}
