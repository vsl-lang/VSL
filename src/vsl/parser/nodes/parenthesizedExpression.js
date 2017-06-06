import Node from './node';

/**
 * Matches a parenthesized expression.
 */
export default class ParenthesizedExpression extends Node {
    
    /**
     * Matches a parenthesized expression e.g. `(E)`
     * 
     * @param {Expression} expression - the expression
     * @param {Object} position a position from nearley
     */
    constructor(expression: Expression, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.expression = expression;
    }
    
    /** @override */
    get children() {
        return ['expression'];
    }
    
    /** @override */
    toString() {
        return `(${this.expression})`;
    }
}