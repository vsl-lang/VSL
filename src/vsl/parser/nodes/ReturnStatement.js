import Node from './node';

/**
 * Wraps a `return ...` call
 *
 */
export default class ReturnStatement extends Node {

    /**
     * Creates a return statement.
     *
     * @param {?Expression} expression the expression if exists for the statement.
     * @param {Object} position a position from nearley
     */
    constructor (expression, position) {
        super(position);

        /** @type {Expression} */
        this.expression = expression;

        /** @type {?ScopeTypeItem} */
        this.expectedReturnType = null;
    }

    clone() {
        return new ReturnStatement(this.expression.clone());
    }

    /** @override */
    get children() {
        return ['expression'];
    }

    /** @override */
    toString() {
        return 'return ' + (this.expression?.toString() || "");
    }
}
