import Node from './node';

/**
 * Short-circut or-expression
 */
export default class OrExpression extends Node {

    /**
     * Creates a wrapper OrExpression
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
        return new OrExpression(this.lhs.clone(), this.rhs.clone());
    }

    /** @override */
    toString() {
        return `(${this.lhs} || ${this.rhs})`
    }
}
