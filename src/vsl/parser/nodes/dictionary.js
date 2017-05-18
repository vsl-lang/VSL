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
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (dictionary: object, type: number, position: Object) {
        super(position);
        
        /** @type {string} */
        this.dictionary = dictionary;
        
        /** @type {VSLTokenType} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return null;
    }
}