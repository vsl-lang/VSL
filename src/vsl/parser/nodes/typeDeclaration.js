import Node from './node';

/**
 * Wraps a type declaration
 * 
 */
export default class TypeDeclaration extends Node {
    
    constructor(
        path: Identifier[],
        optional: bool,
        parent: TypeDeclaration,
        fallback: TypeDeclaration,
        position: Object
    ) {
        super(position);
        
        /** @type {Identifier[]} */
        this.path = path;
        
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