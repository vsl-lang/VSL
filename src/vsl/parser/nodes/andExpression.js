import Node from './node';

/**
 * Short-circut and-expression
 */
export default class AndExpression extends Node {

    /**
     * Creates a wrapper AndExpression
     *
     * @param {Expression} lhs left-hand side of the expression
     * @param {Expression} rhs right-hand side of the expression
     * @param {Object} position a position from nearley
     */
    constructor(lhs, rhs, position) {
        super(position);

        /** @type {Expression} */
        this.lhs = lhs;

        /** @type {Expression} */
        this.rhs = rhs;
    }

    /** @override */
    get children() {
        return ['lhs', 'rhs'];
    }

    clone() {
        return new AndExpression(this.lhs.clone(), this.rhs.clone());
    }

    /** @override */
    toString() {
        return `(${this.lhs} && ${this.rhs})`
    }
}
