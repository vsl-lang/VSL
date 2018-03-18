import Node from './node';

/**
 * Matches an assignment expression.
 */
export default class AssignmentExpression extends Node {

    /**
     * Creates a AssignmentExpression
     *
     * @param {Expression} target What you are setting
     * @param {Expression} value What you are setting to
     * @param {?string} operator The operator
     * @param {Object} position a position from nearley
     */
    constructor(target, value, operator, position) {
        super(position);

        /**
         * What you are setting
         * @type {Expression}
         */
        this.target = target;

        /** @type {Expression} */
        this.value = value;

        /** @type {string} */
        this.operator = operator || "";
    }

    /** @override */
    get children() {
        return ['target', 'value'];
    }

    clone() {
        return new AssignmentExpression(this.target.clone(), this.value.clone(), this.operator);
    }

    /** @override */
    toString() {
        return `${target} ${modifier}= ${value}`;
    }
}
