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
     * @param {Expression} head the object to subscript
     * @param {Expression} expression the provided expression
     * @param {Object} position a position from nearley
     */
    constructor (head: Expression, expression: Expression, nullable: boolean, isClosure: boolean, position: Object) {
        super(position);

        /** @type {Expression} */
        this.head = head;
        
        /** @type {Expression} */
        this.expression = expression;
        
        /** @type {boolean} */
        this.nullable = nullable;
        
        /** @type {boolean} */
        this.isClosure = isClosure;
    }
    
    /** @override */
    get children () {
        return ['expression', 'nullable'];
    }
    
    /** @override */
    toString() {
        return `${this.nullable?'?':''}[${this.expression}]`;
    }
}