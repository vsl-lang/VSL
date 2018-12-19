import Node from './node';

/**
 * Wraps a `yield ...` statement
 *
 */
export default class YieldStatement extends Node {

    /**
     * Creates a yield statement.
     *
     * @param {?Expression} expression the expression if exists for the statement.
     * @param {Object} position a position from nearley
     */
    constructor(expression, position) {
        super(position);

        /** @type {Expression} */
        this.expression = expression;

        /** @type {?ScopeTypeItem} */
        this.expectedYieldType = null;
    }

    clone() {
        return new YieldStatement(this.expression.clone());
    }

    /** @override */
    get children() {
        return ['expression'];
    }

    /** @override */
    toString() {
        return 'yield ' + this.expression.toString();
    }
}
