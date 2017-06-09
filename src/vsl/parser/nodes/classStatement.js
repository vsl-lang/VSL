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
     * @param {Identifier} name - The name of the class
     * @param {Identifier[]} superclasses - The superclasses to inherit or implement
     * @param {CodeBlock} statements - The class's body
     * @param {Annotation[]} annotations - The annotations of the class
     * @param {Object} position - a position from nearley
     */
    constructor(
        access: string[],
        name: Identifier,
        superclasses: Identifier[],
        statements: Node[],
        annotations: Annotation[],
        position: Object
    ) {
        super(position);
        
        /** @type {string} */
        this.access = access;

        /** @type {Identifier} */
        this.name = name;

        /** @type {Identifier[]} */
        this.superclasses = superclasses;

        /** @type {CodeBlock} */
        this.statements = statements;

        /** @type {Annotation[]} */
        this.annotations = annotations || [];
    }
    
    /** @override */
    toString() {
        return `${this.annotations.join("\n") + (this.annotations.length?" ":"")}`+
        `${this.access.join(" ")}${this.access.length ? " " : ""}class` +
        ` ${this.name}: ${
            this.superclasses === null ?
            "Object" : this.superclasses.join(", ")
        } ${this.statements}`
    }
    
    /** @override */
    get children() {
        return ['name', 'superclasses', 'statements', 'annotations'];
    }
}
