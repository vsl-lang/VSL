import Node from './node';

/**
 * Matches a property expression.
 * 
 * A property expression is anything in the form `head tail`.
 * 
 * A tail can have various markers including:
 *  - accessors through `.`
 *  - subscript `[ ... ]`
 *  - function calls `( ... )`
 *  - etc
 * 
 * Make sure you specify tail still if it doesn't exist
 */
export default class PropertyExpression extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     * 
     * @param {Expression} expression the primary expression
     * @param {Object} position a position from nearley
     */
    constructor (head: any, tail: any, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.head = head;
        
        /** @type {Identifier[]|Subscript[]|FunctionCall[]} */
        this.tail = tail;
    }
    
    get children () {
        return [head, tail];
    }
}