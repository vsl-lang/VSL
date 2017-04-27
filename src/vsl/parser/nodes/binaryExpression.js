import Node from './node';

/**
 * Matches a binary expression
 * 
 * See Also: `UnaryExpression`
 * 
 * This matches any generic 
 */
export default class BinaryExpression extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     * 
     * @param {Expression} lhs left-hand side of the expression
     * @param {Expression} rhs right-hand side of the expression
     * @param {string} operator the operator for the expression
     * @param {Object} position a position from nearley
     */
    constructor (lhs: any, rhs: any, operator: string, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.lhs = lhs;
        /** @type {Expression} */
        this.rhs = rhs;
        
        /** @type {string} */
        this.op = operator;
    }
    
    /**
     * Returns all the child nodes
     * @return empty array
     * @override
     */
    children() {
        return [this.op, lhs, rhs];
    }
}