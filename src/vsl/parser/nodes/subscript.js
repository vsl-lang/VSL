import Node from './node';

/**
 * Matches a subscript expression inside a PropertyExpression
 * 
 * @example
 * head[tail]
 */

export default class Subscript extends Node {
    /**
     * Creates a subscript
     * 
     * @param {Expression} expression the provided expression
     * @param {Object} position a position from nearley
     */
    constructor (expression: any, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.expression = expression;
    }
    
    /** @override */
    get children () {
        return ['expression'];
    }
    
    /** @override */
    toString() {
        return `[${this.expression}]`;
    }
}