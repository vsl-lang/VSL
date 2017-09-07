import Node from './node';

/**
 * Wraps a type declaration
 * 
 */
export default class TypeDeclaration extends Node {
    
    constructor(
        head: Identifier,
        tail: Identifier,
        optional: bool,
        parent: TypeDeclaration,
        fallback: TypeDeclaration,
        position: Object
    ) {
        super(position);
        
        /** @type {Identifier} */
        this.head = head;
        
        /** @type {Identifier} */
        this.tail = tail;
        
        /** @type {bool} */
        this.optional = optional;
        
        /** @type {TypeDeclaration} */
        this.parent = parent;
        
        /** @type {TypeDeclaration} */
        this.fallback = fallback;
    }
    
    /** @override */
    get children() {
        return this.path ? [this.path[0]] : null;
    }
}