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
     * @param {array} tuple the literal tuple value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (tuple: array, position: Object) {
        // TODO: remember a tuple has multiple types, we need to implement that

        super(position);

        /** @type {array} */
        this.tuple = tuple;
    }
    
    /** @override */
    get children() {
        return null;
    }
}
