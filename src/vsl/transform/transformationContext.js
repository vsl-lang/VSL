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
         * Stores the primary optional type. Should be the backing type NOT the
         * self type. i.e. `Optional` not `Optional<T>`.
         * @type {?ScopeTypeItem}
         */
        this.optionalType = null;

        /**
         * If a root manifest has been declared
         * @type {boolean}
         */
        this.hasManifestRoot = false;

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
        this.optionalType = target.optionalType;
        this.staticEnumerationType = target.staticEnumerationType;

        for (const [key, values] of target.benchmarks) {
            this.benchmarks.set(
                key, (this.benchmarks.get(key) || []).concat(values)
            );
        }
    }

    /**
     * Checks if first param is castable to the second param. This is different
     * from {@link ScopeTypeItem#castableTo} as it handles other type of
     * implicit casts such as value -> optional for example:
     *
     *      let a: Int? = 1
     *
     * has 1 being implicitly cast to optional
     *
     * Assuming:
     *
     *     let value: T = // ...
     *     let target: U = value
     *
     * @param {ScopeTypeItem} valueType
     * @param {ScopeTypeItem} targetType
     * @return {boolean} if the cast would be valid.
     */
    contextuallyCastable(valueType, targetType) {
        // Check if directly castable
        if (valueType.castableTo(targetType)) {
            return true;
        }

        // Otherwise check if `Optional<T>(value) is U`
        // #defined(Optional)
        // Optional is #contextType(optional)
        // T is #parameter(U, 0)
        const optionalType = this.isOptionalType(targetType);
        if (optionalType && valueType.castableTo(optionalType)) {
            return true;
        }

        // If other contextual casts need to be supported they would go here.
        // The castableTo only checks for an valid OO cast.

        return false;
    }

    /**
     * Checks if a type is an optional type in this context. Returns the
     * parameter type in context otherwise returns null.
     *
     * @param {ScopeTypeItem} type
     * @return {boolean}
     */
    isOptionalType(type) {
        const isOptionalType = this.optionalType && type.genericClass === this.optionalType;
        if (isOptionalType) {
            return type.parameters[0];
        } else {
            return null;
        }
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
