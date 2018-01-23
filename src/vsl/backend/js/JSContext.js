/**
 * Specifies a JS position
 */
export default class JSContext {
    /**
     * @param {JSBackend} backend JS backend.
     * @param {Statement[]} context List of statements representing function.
     */
    constructor(backend, context) {
        /** @type {JSBackend} */
        this.backend = backend;

        /** @type {Statement[]} */
        this.context = context;
    }
}
