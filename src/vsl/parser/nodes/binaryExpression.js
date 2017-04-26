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
        
        this.lhs = lhs;
        this.rhs = rhs;
        
        this.op = operator;
    }
    
    get children () {
        return [lhs, rhs, operator];
    }
}