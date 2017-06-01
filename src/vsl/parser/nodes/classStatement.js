import Node from './node';
import CodeBlock from './codeBlock';

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
        this.statements = statements === null ? new CodeBlock([]) : statements;
    }
    
    /** @override */
    toString() {
        return `${this.access.join(" ")}${this.access.length ? " " : ""}class` +
        ` ${this.name}: ${
            this.superclasses === null ?
            "Object" : this.superclasses.join(", ")
        } ${this.statements}`
    }
    
    /** @override */
    get children() {
        return ['name', 'superclasses', 'statements'];
    }
}