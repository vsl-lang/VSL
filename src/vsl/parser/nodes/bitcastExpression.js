import Node from './node';

/**
 * Matches an bitcast expression.
 */
export default class BitcastExpression extends Node {

    /**
     * Creates a BitcastExpression
     *
     * @param {Expression} target Target type
     * @param {Expression} value value to cast.
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
        this.targetTy = null;

        /** @type {?ScopeTypeItem} */
        this.valueTy = null;
    }

    /** @override */
    get children() {
        return ['target', 'value'];
    }

    clone() {
        return new BitcastExpression(this.target.clone(), this.value.clone(), this.operator);
    }

    /** @override */
    toString() {
        return `${this.target}::${this.value}`;
    }
}
