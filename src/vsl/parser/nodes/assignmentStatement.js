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
        return ['lhs', 'rhs'];
    }
}