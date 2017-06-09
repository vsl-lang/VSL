/**
 * Stores and manages a global context during transformation. This stores
 * information about primitives and other global items such as linkage which
 * passes can access through the `context` property on the transformer.
 */
export default class TransformationContext {
    /**
     * Creates a brand new TransformationContext. Pass an existing one to a
     * {@link Transformer} to use it.
     */
    constructor() {
        /**
         * A map of `id, key` of a primitive binding.
         *
         * @type {Map<string, ClassStatement[]>}
         */
        this.primitives = new Map();
    }

    /**
     * Adds a primitive link (e.g. Integer -> class Int) to the context.
     *
     * @param {string} name - the common ID of the primitive ID.
     * @param {ClassStatement} statement - The annotation's associated class.
     */
    addPrimitive(name: string, statement: ClassStatement) {
        if (this.primitives.get(name) instanceof Array) {
            this.primitives.get(name).push(statement);
        } else {
            this.primitives.set(name, [statement]);
        }
    }
}
