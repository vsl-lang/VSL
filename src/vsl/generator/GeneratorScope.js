/**
 * Handles information about a single stack/scope within a generator.
 */
export default class GeneratorScope {
    /**
     * Creates an empty generator scope with default expression state and all.
     * You probably just want to use a generator and have that handle these
     * scopes.
     */
    constructor() {
        this.expressionCount = 0;
    }
}