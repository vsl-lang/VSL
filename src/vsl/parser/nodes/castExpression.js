import Node from './node';

/**
 * Matches an cast expression.
 */
export default class CastExpression extends Node {

    /**
     * Creates a BitcastExpression
     *
     * @param {Expression} value value to cast.
     * @param {Expression} target Target type
     * @param {Object} position a position from nearley
     */
    constructor(value, target, position) {
        super(position);

        /** @type {Expression} */
        this.value = value;

        /**
         * What you are setting
         * @type {Type}
         */
        this.target = target;

        /** @type {?ScopeTypeItem} */
        this.targetTy = null;

        /** @type {?ScopeTypeItem} */
        this.valueTy = null;
    }

    /** @override */
    get children() {
        return ['value', 'target'];
    }

    clone() {
        return new CastExpression(this.value.clone(), this.target.clone(), this.operator);
    }

    /** @override */
    toString() {
        return `${this.value} as ${this.target}`;
    }
}
