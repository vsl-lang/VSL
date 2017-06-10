/**
 * Represents an argument for a function scope item.
 */
export default class ScopeFuncItemArgument {
    /**
     * Creates a scope func item argument given various details. If a type has a
     * default value for the param, mark that parameter as optional if
     * applicable, meaning that it does not create any conflicts.
     *
     * @param  {string} name     The name of the function argument, leave
     *                           empty if there is none
     * @param  {bool}   optional Whether the argument is optional, if the
     *                           argument has a default value, then you may mark
     *                           this.
     * @param {ScopeTypeItem|string} type The type of the argument, if it is an
     *                                    optional, mark the next param as so
     */
    constructor(name: string, optional: bool, type: ScopeTypeItem | string) {
        /** @type {string} */
        this.name = name;

        /** @type {bool} */
        this.optional = optional;

        /** @type {ScopeTypeItem|string} */
        this.type = type;
    }

    /** @override */
    toString() {
        return `${this.name || "*"}: ${this.type.rootId || this.type}${this.optional ? "?" : ""}`;
    }
}
