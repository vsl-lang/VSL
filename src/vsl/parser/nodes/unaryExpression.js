import Node from './node';

/**
 * Matches a unary expression
 *
 * See Also: `BinaryExpression`
 *
 * This matches any generic unary expression
 */
export default class UnaryExpression extends Node {

    /**
     * Creates a wrapper ExperssionStatement
     *
     * @param {Expression} expression the expression
     * @param {string} operator the operator for the expression
     * @param {Object} position a position from nearley
     */
    constructor (expression: any, operator: string, position: Object) {
        super(position);

        /** @type {Expression} */
        this.expression = expression;

        /** @type {string} */
        this.op = operator;
    }

    /** @override */
    get children () {
        return ['expression'];
    }

    /** @override */
    toString() {
        return this.op + `(${this.expression})`
    }
}
