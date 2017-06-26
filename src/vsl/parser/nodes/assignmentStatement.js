import Node from './node';

/**
 * Matches an assignment statement, anything which declares an alias at the type
 * scope level.
 */
export default class AssignmentStatement extends Node {
    
    /**
     * Creates a AssignmentStatement
     *
     * @param {AssignmentType} type The assignment type
     * @param {TypedIdentifier} identifier The variable's identifier & type
     * @param {Expression} value The variable's inital value
     * @param {Object} position a position from nearley
     */
    constructor (type: AssignmentType, identifier: TypedIdentifier, value: Expression, position: Object) {
        super(position);
        
        /**
         * Specifies whether the assignment is a constant or variable
         * @type {AssignmentType}
         */
        this.type = type;
        
        /** @type {TypedIdentifier} */
        this.identifier = identifier;
        
        /** @type {Expression} */
        this.value = value;
        
        /**
         * The ref in a scope this declares the alias too
         * @type {?ScopeAliasItem}
         */
        this.ref = null;
    }
    
    /** @override */
    get identifierPath() {
        return this.identifier;
    }
    
    /** @override */
    get children() {
        return ['identifier', 'value'];
    }
    
    /** @override */
    toString() {
        let t;
        return (this.type === 0 ? "var" : "let") +
            ` ${this.identifier.identifier}` +
            ` ${(t = this.identifier.type || (this.value && this.value.exprType) || null) ? `: ${t} ` : ""}` +
            (this.value ? "= " + this.value : "");
    }
}
