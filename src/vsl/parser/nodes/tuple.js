import Node from './node';

/**
 * Matches an tuple literal.
 *
 * This matches a tuple literal.
 */
export default class Tuple extends Node {

    /**
     * Creates a wrapper for tuples
     *
     * @param {ExpressionStatement[]} expressions the literal tuple value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (expressions, position) {
        super(position);

        /** @type {ExpressionStatement[]} */
        this.expressions = expressions;

        /** @type {?ScopeTupleItem} */
        this.reference = null;
    }

    clone() {
        return new Tuple(
            this.expressions.map(item => item.clone())
        )
    }

    /** @override */
    get children() {
        return ['expressions'];
    }

    /** @override */
    toString() {
        return `(${this.expressions.join(", ")})`;
    }
}
