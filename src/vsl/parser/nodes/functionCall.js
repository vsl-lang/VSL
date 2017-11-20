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
     * @param {Expression} head the function to call
     * @param {ArgumentCall[]} args the provided arguments
     * @param {Object} position a position from nearley
     */
    constructor (head: Expression, args: ArgumentCall[], position: Object) {
        super(position);

        /** @type {Expression} */
        this.head = head;

        /** @type {ArgumentCall[]} */
        this.arguments = args;
    }
    
    clone() {
        return new FunctionCall(
            this.head.clone(),
            this.arguments.map(arg => arg.clone())
        )
    }
    
    /** @override */
    get children () {
        return ['head', 'arguments'];
    }
    
    /** @override */
    toString() {
        return `${this.head}(${this.arguments.join(', ')})`;
    }
}
