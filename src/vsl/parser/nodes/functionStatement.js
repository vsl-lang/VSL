import Node from './node';

/**
 * Wraps a function
 * 
 */
export default class FunctionStatement extends Node {
    
    constructor(
        access: string[],
        name: string,
        args: FunctionArgument[],
        returnType: Type,
        statements: Node[],
        position: Object
    ) {
        super(position);
        
        /** @type {string} */
        this.access = access;
        this.name = name;
        this.args = args;
        this.returnType = returnType;
        this.statements = statements;
    }
    
    get children () {
        return identifier;
    }
}