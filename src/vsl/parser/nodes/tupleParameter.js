import Node from './node';

/**
 * A tuple param
 */
export default class TupleParameter extends Node {

    /**
     * Creates a wrapper for tuple param
     *
     * @param {Identifier} name - Name of param
     * @param {ExpressionStatement} value - Value of param
     * @param {Object} position a position from nearley
     */
    constructor(name, value, position) {
        super(position);

        /** @type {Identifier} */
        this.name = name;

        /** @type {ExpressionStatement} */
        this.value = value;

        /** @type {?ScopeAliasItem} */
        this.reference = null;
    }

    /** @override */
    get children() {
        return ['name', 'value'];
    }

    /** @override */
    toString() {
        return `${this.name}: ${this.value}`;
    }
}
