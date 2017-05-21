import Node from './node';

/**
 * Wraps a function
 * 
 */
export default class FunctionStatement extends Node {
    
    /**
     * Constructs a generic function statement
     * 
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the given function
     * @param {FunctionArgument[]} args - The arguments of the function
     * @param {Type} returnType - The function's returnType.
     * @param {Node[]} statements - The statements in the function body.
     * @param {Object} position - a position from nearley
     */
    constructor(
        access: string[],
        name: Identifier,
        args: FunctionArgument[],
        returnType: Type,
        statements: Node[],
        position: Object
    ) {
        super(position);
        
        /** @type {string} */
        this.access = access;
        this.name = name;
        this.args = args || [];
        this.returnType = returnType;
        this.statements = statements;
    }
    
    /** @override */
    get identifierPath() {
        return this.name;
    }
    
    /** @override */
    get children() {
        return ['name', 'args', 'returnType', 'statements'];
    }
    
    /** @override */
    toString() {
        return `${this.access.join(" ")}${this.access.length ? " " : ""}func ${this.name.identifier.id}(${this.args.join(", ")})${this.returnType ? " -> " + this.returnType : ""} ${this.statements}`
    }
}