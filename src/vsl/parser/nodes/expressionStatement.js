import Node from './node';

/**
 * Wraps any expression
 *
 * These include:
 *  - PropertyExpression
 *  - BinaryExpression
 *  - UnaryExpression
 *
 * Or even primitive nodes:
 *  - Identifier
 *  - Literal
 *
 * This can be used as a delegate to determine which and how to interpret a
 * given expression. This should be ignored in terms of tree matching
 *
 */
export default class ExpressionStatement extends Node {
    
    /**
     * Creates a wrapper ExpressionStatement
     *
     * @param {Expression} expression the expression to wrap
     * @param {Object} position a position from nearley
     */
    constructor (expression: any, isClosure: boolean, parenthesized: boolean, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.expression = expression;
        
        /** @type {boolean} */
        this.isClosure = isClosure;
        
        /** @type {boolean} */
        this.parenthesized = parenthesized;
    }
    
    clone() {
        return new ExpressionStatement(this.expression.clone(), this.isClosure, this.parenthesized)
    }
    
    /** @override */
    get children() {
        return ['expression'];
    }
    
    /** @override */
    toString() {
        return this.expression.toString();
    }
}
