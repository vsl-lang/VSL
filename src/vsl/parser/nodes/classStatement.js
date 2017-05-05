import Node from './node';

/**
 * Wraps a class
 * 
 */
export default class ClassStatement extends Node {
    
    constructor(
        access: string[],
        name: string,
        superclasses: Node[],
        statements: [],
        position: Object
    ) {
        super(position);
        
        /** @type {string} */
        this.access = access;
        this.name = name;
        this.superclasses = superclasses;
        this.statements = statements
    }
    
    get children () {
        return identifier;
    }
}