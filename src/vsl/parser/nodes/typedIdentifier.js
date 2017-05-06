import Node from './node';

/**
 * Wraps a typed identifier.
 * 
 */
export default class TypedIdentifier extends Node {
    
    /**
     * Creates an identifier
     * 
     * @param {string} identifier the identifier
     * @param {Object} position a position from nearley
     */
    constructor (identifier: string, type: Type, position: Object) {
        super(position);
        
        /** @type {string} */
        this.identifier = identifier;
        this.type = type;
    }
    
    /** @override */
    get children() {
        return ['type'];
    }
}