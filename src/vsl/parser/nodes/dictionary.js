import Node from './node';

/**
 * Matches an dictionary literal.
 * 
 * This matches a dictionary literal.
 */
export default class Dictionary extends Node {

    /**
     * Creates a wrapper for dictionaries
     * 
     * @param {Object} dictionary the literal dictionary value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (dictionary: object, position: Object) {
        super(position);

        /** @type {string} */
        this.dictionary = dictionary;
    }

    /** @override */
    get children() {
        return null;
    }
}
