import Node from './node';

/**
 * Matches an expression as a top-level statement
 */
export default class ExpressionStatement extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     * 
     * @param {Expression} expression the primary expression
     * @param {Object} position a position from nearley
     */
    constructor(expression: any, position: Object) {
        super(position);
        this.expression = expression;
    }
}