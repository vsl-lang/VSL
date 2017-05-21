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
     * @param {array} array the literal array value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position - a position from nearley
     */
    constructor (array: array, type: number, position: Object) {
        super(position);
        
        /** @type {array} */
        this.array = array;
        
        /** @type {VSLTokenType} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return null;
    }
}