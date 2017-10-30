/**
 * Emitted by the type lookup classes when something could not be found.
 */
export default class TypeLookupError {
    /**
     * Creates an error given node and message. If you are in a resolver we
     * reccomend using the `#emit(message:)` function which will automatically
     * handle all of this stuff.
     *
     * @param {string} message - What the error message should say
     * @param {Node} node - Where this occured
     * @param {?ErrorRef} ref - Error ref.
     */
    constructor(message: string, node: Node, ref: Object = null) {
        /** @type {string} */
        this.message = message;
        
        /** @type {string} */
        this.name = "Type Lookup Error";
        
        /** @type {Node} */
        this.node = node;
        
        /**
         * @type {?ErrorRef}
         */
        this.ref = ref;
    }
}
