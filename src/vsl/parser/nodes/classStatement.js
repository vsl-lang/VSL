import Node from './node';

/**
 * Wraps a class
 * 
 */
export default class ClassStatement extends Node {
    
    /**
     * Constructs a generic function statement
     * 
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier[]} superclass - The superclasses to inherit or implement
     * @param {Node[]} statements - The class's body.
     * @param {Object} position - a position from nearley
     */
    constructor(
        access: string[],
        name: Identifier,
        superclasses: Identifier[],
        statements: [],
        position: Object
    ) {
        super(position);
        
        /** @type {string} */
        this.access = access;
        this.name = name;
        this.superclasses = superclasses;
        this.statements = statements;
    }
    
    /** @override */
    get identifierPath() {
        return this.name;
    }
    
    /** @override */
    get children() {
        return ['name', 'superclasses', 'statements'];
    }
}