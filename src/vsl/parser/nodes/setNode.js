import Node from './node';

/**
 * Matches an set literal.
 */
export default class SetNode extends Node {

    /**
     * Creates a wrapper for sets
     *
     * @param {Node[]} set the literal set value of the literal
     * @param {Object} position a position from nearley
     */
    constructor (set: Set, position: Object) {
        super(position);

        /** @type {Node[]} */
        this.set = set;
    }
    
    clone() {
        return new SetNode(
            this.set.map(item => item.clone())
        )
    }

    /** @override */
    get children() {
        return null;
    }
}
