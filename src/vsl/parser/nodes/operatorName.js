import Node from './node';

/**
 * Represents an operator itself. Example is in `func +(x: T, y: T)` the `+`
 * is distinguished as this.
 */
export default class OperatorName extends Node {

    /**
     * Creates a wrapper operator name
     *
     * @param {string} value operator name
     * @param {Object} position a position from nearley
     */
    constructor(value, position) {
        super(position);
        this.value = value;
    }

    /** @override */
    get children () {
        return [];
    }

    /** @override */
    toString () {
        return this.value;
    }
}
