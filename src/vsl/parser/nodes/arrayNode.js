import Node from './node';

/**
 * Matches an array literal.
 *
 * This matches an array literal.
 */
export default class ArrayNode extends Node {

    /**
     * Creates a wrapper for arrays
     *
     * @param {Node[]} array the literal array value of the literal
     * @param {Object} position - a position from nearley
     */
    constructor (array: array, position: Object) {
        super(position);

        /** @type {Node[]} */
        this.array = array;
    }

    clone() {
        return new ArrayNode(this.array.map(node => node.clone()));
    }

    /** @override */
    get children() {
        return ['array'];
    }
}
