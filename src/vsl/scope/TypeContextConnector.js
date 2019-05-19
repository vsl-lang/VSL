/**
 * Data structure which takes a TypeContext and an object and associates them.
 * That way with the same TypeContext the same object is published. Additionally,
 * a specific group of 'GenericParameters' which this connector should evaluate
 * should be provided.
 */
export default class TypeContextConnector {

    /**
     * @param {GenericParameterItem[]} params - Parameters to evaluate
     */
    constructor(params) {
        /** @private */
        this.params = params;

        // array corresponding to this.params of [ScopeTypeItem[], value]
        /** @private */
        this.values = [];
    }

    /**
     * Adds a type context to the connector.
     * @param {TypeContext} context
     * @param {Object} value
     * @throws {TypeError} if context doesn't provide all the params
     */
    set(context, value) {
        if (this.get(context) !== null) return;

        const typeArray = [];
        for (let i = 0; i < this.params.length; i++) {
            const type = context.getTypeForGenericParameter(this.params[i]);

            if (type === null) {
                throw new TypeError(`Attempted to add context connector missing a parameter`);
            }

            typeArray.push(type);
        }

        this.values.push([typeArray, value]);
    }

    /**
     * Has implementation for a given context
     * @param {TypeContext} context
     * @return {boolean}
     */
    has(context) {
        return this.get(context) !== null;
    }

    /**
     * Obtains a value for a type context
     * @param {TypeContext} context
     * @return {?Object} null if not found
     */
    get(context) {
        const typeArray = [];
        for (let i = 0; i < this.params.length; i++) {
            const type = context.getTypeForGenericParameter(this.params[i]);

            if (type === null) {
                return null;
            }

            typeArray.push(type);
        }

        main:
        for (let i = 0; i < this.values.length; i++) {
            const typesToCheckAgainst = this.values[i][0];

            // Check if current value
            for (let j = 0; j < typesToCheckAgainst.length; j++) {
                if (typesToCheckAgainst[j] !== typeArray[j]) {
                    // Then stop this and try the next group
                    continue main;
                }
            }

            // Otherwise this value matched
            return this.values[i][1];
        }

        return null;
    }

    /**
     * Obtains debug description of the mappings
     * @return {string}
     */
    toString() {
        return this.values
            .map(([types]) => `<${types.map((ty, i) => `${this.params[i]}: ${ty}`).join(", ")}> = (bound)`)
            .join("\n");
    }
}
