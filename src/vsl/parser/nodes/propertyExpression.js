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
     * Matches a member-expression e.g. `(E).b`
     * 
     * @param {Expression} head - the primary expression
     * @param {Identifier|Subscript|FunctionCall} tail - The right part of the part of the node
     * @param {boolean} optional - Whether the RHS is optional.
     * @param {Object} position a position from nearley
     */
    constructor(head: any, tail: any, optional: boolean, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.head = head;
        
        /** @type {Identifier|Subscript|FunctionCall} */
        this.tail = tail;
        
        /** @type {boolean} */
        this.optional = optional;
    }
    
    /** @override */
    get children() {
        return ['head', 'tail'];
    }
    
    /** @override */
    toString() {
        return `(${this.head}).${this.tail}${this.optional ? '?' : ''}`;
    }
}