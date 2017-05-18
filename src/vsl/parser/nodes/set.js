import Node from './node';

/**
 * Matches an set literal.
 * 
 * This matches a set literal.
 */
export default class Set extends Node {
    
    /**
     * Creates a wrapper for sets
     * 
     * @param {Set} set the literal set value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (set: Set, type: number, position: Object) {
        super(position);
        
        /** @type {string} */
        this.set = set;
        
        /** @type {VSLTokenType} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return null;
    }
}