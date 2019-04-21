import DeclarationStatement from './declarationStatement';

/**
 * Matches an dyn field statement.
 */
export default class DynamicFieldStatement extends DeclarationStatement {

    /**
     * Creates a
     *
     * @param {string[]} access A list of access modifiers for the statement
     * @param {TypedIdentifier} name Name of dyn field
     * @param {Array<Getter|Setter>} items The item decls.
     * @param {Object} position a position from nearley
     */
    constructor(access, name, items, position) {
        super(access, position);

        /** @type {TypedIdentifier} */
        this.name = name;

        /** @type {Array<Getter|Setter>} */
        this.items = items;

        /**
         * The ref in a scope this declares the alias too
         * @type {?ScopeDynamicAliasItem}
         */
        this.reference = null;

        /**
         * Type of the field
         * @type {?ScopeTypeItem}
         */
        this.type = null;

        /**
         * The getter maybe
         * @type {?Getter}
         */
        this.getter = null;

        /**
         * The setter maybe
         * @type {?Setter}
         */
        this.setter = null;
    }

    /** @override */
    get children() {
        return ['name', 'items'];
    }

    /** @override */
    toString() {
        return `${this.access.join(" ")} let ${this.name} {\n${this.items.map(i => `    ${i}\n`)}}`
    }
}
