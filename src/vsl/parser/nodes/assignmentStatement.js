import Node from './node';

/**
 * Matches any assignment type.
 * 
 * This matches any generic binary expression.
 */
export default class AssignmentStatement extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     * 
     * @param {AssignmentType} type The assignment type
     * @param {TypedIdentifier} identifier The variable's identifier & type
     * @param {Expression} value The variable's inital value
     * @param {Object} position a position from nearley
     */
    constructor (type: AssignmentType, identifier: TypedIdentifier, value: Expression, position: Object) {
        super(position);
        
        /** @type {AssignmentType} */
        this.type = type;
        /** @type {TypedIdentifier} */
        this.identifier = identifier;
        /** @type {Expression} */
        this.value = value;
    }
    
    /** @override */
    get identifierPath() {
        return this.identifier;
    }
    
    /** @override */
    get children() {
        return ['identifier', 'value'];
    }
    
    /**
     * Gets the type of the assignment
     */
    get exprType() {
        return this.identifier.type || this.value.exprType || null;
    }
    
    /** @override */
    toString() {
        let t;
        return (this.type === 0 ? "var" : "let") +
            ` ${this.identifier.identifier}` +
            ` ${(t = this.exprType) ? `: ${t} ` : ""}` +
            (this.value ? "= " + this.value : "");
    }
}
