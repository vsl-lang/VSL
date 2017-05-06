import Node from './node';

/**
 * Matches an expression as a top-level statement
 */
export default class CommandChain extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     * 
     * @param {Expression[]} expression the primary expression
     * @param {Object} position a position from nearley
     */
    constructor (expressions: any[], position: Object) {
        super(position);
        
        /** @type {Expression[]} */
        this.expressions = expressions;
    }
    
    /** @override */
    get children() {
        return ['expressions'];
    }
}