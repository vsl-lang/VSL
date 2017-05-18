import Node from './node';

/**
 * Matches an immutable dictionary literal.
 * 
 * This matches an immutable dictionary literal.
 */
export default class ImmutableDictionary extends Node {
    
    /**
     * Creates a wrapper for an immutable dictionary
     * 
     * @param {Object} dictionary the literal dictionary value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (dictionary: object, type: number, position: Object) {
        super(position);
        
        /** @type {string} */
        this.dictionary = dic;
        
        /** @type {VSLTokenType} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return null;
    }
}