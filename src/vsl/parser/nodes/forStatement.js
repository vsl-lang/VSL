import Node from './node';

/**
 * Matches an 'for' loop statement.
 */
export default class ForStatement extends Node {
    /**
     * Creates a for-statement
     * 
     * @param {Expression} condition - The condition to check
     * @param {CodeBlock} body - The body of the for statement
     * @param {Object} position - A position from nearley
     */
    constructor(condition, body, position) {
        super(position);
        
        /** @type {Expression} */
        this.condition = condition;
        
        /** @type {body} */
        this.body = body;
    }
}