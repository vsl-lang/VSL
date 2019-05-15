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
     * @param {ArgumentCall[]} expression the provided expression
     * @param {Object} position a position from nearley
     */
    constructor (head: Expression, expression: Expression, position: Object) {
        super(position);

        /** @type {Expression} */
        this.head = head;

        /** @type {ArgumentCall[]} */
        this.expression = expression;
    }

    clone() {
        return new Subscript(
            this.head.clone(),
            this.expression.clone()
        )
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
