import DeclarationStatement from './declarationStatement';

/**
 * Matches an assignment statement, anything which declares an alias at the type
 * scope level.
 */
export default class AssignmentStatement extends DeclarationStatement {

    /**
     * Creates a AssignmentStatement
     *
     * @param {string[]} access A list of access modifiers for the statement
     * @param {AssignmentType} type The assignment type
     * @param {TypedIdentifier} name The variable's identifier & type
     * @param {?Expression} value The variable's inital value
     * @param {boolean} isLazy If the assignment is lazy
     * @param {Object} position a position from nearley
     */
    constructor(access, type, name, value, isLazy, position) {
        super(access, position);

        /**
         * Specifies whether the assignment is a constant or variable
         * @type {AssignmentType}
         */
        this.type = type;

        /** @type {TypedIdentifier} */
        this.name = name;

        /** @type {?Expression} */
        this.value = value;

        /** @type {boolean} */
        this.isLazy = isLazy;

        /**
         * The ref in a scope this declares the alias too
         * @type {?ScopeAliasItem}
         */
        this.ref = null;

        /**
         * If is a global/static assignment
         * @type {?boolean}
         */
        this.isGlobal = null;
    }

    /** @override */
    get children() {
        return ['name', 'value'];
    }

    clone() {
        return new AssignmentStatement(this.access.slice(), this.type, this.name.clone(), this.value?.clone());
    }

    /** @override */
    toString() {
        let t;
        return (this.type === 0 ? "let" : "const") +
            ` ${this.identifier.identifier}` +
            ` ${(t = this.identifier.type || (this.value && this.value.exprType) || null) ? `: ${t} ` : ""}` +
            (this.value ? "= " + this.value : "");
    }
}
