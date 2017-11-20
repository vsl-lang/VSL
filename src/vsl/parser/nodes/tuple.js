import Node from './node';

/**
 * Matches an tuple literal.
 *
 * This matches a tuple literal.
 */
export default class Tuple extends Node {

    /**
     * Creates a wrapper for tuples
     *
     * @param {Node[]} tuple the literal tuple value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (tuple: array, position: Object) {
        super(position);

        /** @type {array} */
        this.tuple = tuple;
    }
    
    clone() {
        return new Tuple(
            this.tuple.map(item => item.clone())
        )
    }
    
    /** @override */
    get children() {
        return null;
    }
}
