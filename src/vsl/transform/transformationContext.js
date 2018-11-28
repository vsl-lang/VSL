/**
 * @typedef {Object} PrimitiveContext
 * @property {ClassStatement[]} types All the candidate types
 * @property {?ClassStatement} precType A type which also exists in `types`
 *                                      which is the type which takes precedence
 *                                      in case of a dupe.
 */

/**
 * Stores and manages a global context during transformation. This stores
 * information about primitives and other global items such as linkage which
 * passes can access through the `context` property on the transformer.
 */
export default class TransformationContext {
    /**
     * Creates a brand new TransformationContext. Pass an existing one to a
     * {@link Transformer} to use it.
     *
     * @param {string} backendName - the backend which will be used.
     */
    constructor(backendName = null) {
        /**
         * A map of `id, key` of a primitive binding.
         *
         * @type {Map<string, PrimitiveContext>}
         */
        this.primitives = new Map();

        /**
         * Name of backend which will be used
         * @type {string}
         */
        this.backendName = backendName;

        /**
         * Stores a timing list of each operation.
         * @type {Map}
         */
        this.benchmarks = new Map();

        /**
         * Stores the primary boolean instance
         * @type {?ScopeTypeItem}
         */
        this.booleanType = null;

        /**
         * Stores the primary enumeration backing instance.
         * @type {?ScopeTypeItem}
         */
        this.staticEnumerationType = null;
    }

    /**
     * Merges another transformation context into the current one (used in
     * modules for example)
     * @param {TransformationContext} target - The transformation context which
     *                                       is merged into the _current_ one
     */
    merge(target) {
        // O: KEEP
        target.primitives.forEach((context, name) => this.primitives.set(name, context));
        this.booleanType = target.booleanType;
    }

    /**
     * Adds a primitive link (e.g. Integer -> class Int) to the context.
     *
     * @param {string} name - the common ID of the primitive ID.
     * @param {boolean} precType - a boolean stating if the type should take
     *                           precedence in all cases with ambiguous
     *                           raw primitive constrained candidates.
     * @param {ClassStatement} statement - The annotation's associated class.
     */
    addPrimitive(name: string, precType: boolean, statement: ClassStatement) {
        if (!this.primitives.has(name)) {
            this.primitives.set(name, {
                types: [],
                precType: null
            });
        }

        // The primitive object with types/precType
        let primitive = this.primitives.get(name);

        // We can throw away the existing precType because if you override a
        // precType you deserve this anyway.
        if (precType === true) primitive.precType = statement;

        // Push the new statement to list of all type
        primitive.types.push(statement);
    }
}
