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
     * @param {Expression} value The variable's inital value
     * @param {Object} position a position from nearley
     */
    constructor(access, type, name, value, position) {
        super(access, position);
        
        /**
         * Specifies whether the assignment is a constant or variable
         * @type {AssignmentType}
         */
        this.type = type;
        
        /** @type {TypedIdentifier} */
        this.name = name;
        
        /** @type {Expression} */
        this.value = value;
        
        /**
         * The ref in a scope this declares the alias too
         * @type {?ScopeAliasItem}
         */
        this.ref = null;
    }
    
    /** @override */
    get children() {
        return ['name', 'value'];
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
