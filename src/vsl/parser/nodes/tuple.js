import Node from './node';

/**
 * Matches an tuple literal.
 * 
 * This matches a tuple literal.
 */
export default class Set extends Node {
    
    /**
     * Creates a wrapper for tuples
     * 
     * @param {array} tuple the literal tuple value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (tuple: array, type: number, position: Object) {
        // TODO: remember a tuple has multiple types, we need to implement that
        
        super(position);
        
        /** @type {array} */
        this.tuple = tuple;
        
        /** @type {VSLTokenType} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return null;
    }
}