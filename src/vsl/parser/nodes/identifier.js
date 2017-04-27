import Node from './node';

/**
 * Wraps a identifier.
 * 
 * Identifiers are specified by the tokenizer but this serves just as a class
 *  which is used for the parser
 * 
 */
export default class Identifier extends Node {
    
    /**
     * Creates an identifier
     * 
     * @param {string} identifier the identifier
     * @param {Object} position a position from nearley
     */
    constructor (identifier: string, position: Object) {
        super(position);
        
        /** @type {string} */
        this.identifier = identifier;
    }
    
    get children () {
        return identifier;
    }
    
    get unbox () {
        return true;
    }
}