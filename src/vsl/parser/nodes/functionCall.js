import Node from './node';

/**
 * Matches a function call inside a PropertyExpression
 * 
 * @example
 * head(argument)
 */

export default class FunctionCall extends Node {
    /**
     * Creates a function call
     * 
     * @param {ArgumentCall[]} args the provided arguments
     * @param {Object} position a position from nearley
     */
    constructor (args: ArgumentCall[], position: Object) {
        super(position);

        /** @type {ArgumentCall[]} */
        this.arguments = args;
    }
    
    /** @override */
    get children () {
        return ['arguments'];
    }
    
    /** @override */
    toString() {
        return `(${this.arguments.join(', ')})`;
    }
}