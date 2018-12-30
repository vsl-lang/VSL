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
     * @param {Object} position a position from nearley
     */
    constructor(target, value, position) {
        super(position);

        /**
         * What you are setting
         * @type {Expression}
         */
        this.target = target;

        /** @type {Expression} */
        this.value = value;

        /** @type {?ScopeTypeItem} */
        this.reference = null;

        /** @type {?ScopeTypeItem} */
        this.valueReference = null;
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
        return `${this.target} = ${this.value}`;
    }
}
