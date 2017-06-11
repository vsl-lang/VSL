import Node from './node';

/**
 * Matches an set literal.
 * 
 * This matches a set literal.
 */
export default class SetNode extends Node {

    /**
     * Creates a wrapper for sets
     * 
     * @param {Set} set the literal set value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (set: Set, position: Object) {
        super(position);

        /** @type {string} */
        this.set = set;
    }

    /** @override */
    get children() {
        return null;
    }
}
