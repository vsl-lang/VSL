import DeclarationStatement from './declarationStatement';

/**
 * Wraps a function
 *
 */
export default class FunctionStatement extends DeclarationStatement {
    
    /** @override */
    get fancyName() { return "function" }
    
    /**
     * Constructs a generic function statement
     *
     * @param {Annotation[]} annotations - The annotations of the function
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the given function
     * @param {FunctionArgument[]} args - The arguments of the function
     * @param {Type} returnType - The function's returnType.
     * @param {Node[]} statements - The statements in the function body.
     * @param {Object} position - a position from nearley
     */
    constructor(
        annotations: Annotation[],
        access: string[],
        name: Identifier,
        args: FunctionArgument[],
        returnType: Type,
        statements: Node[],
        position: Object
    ) {
        super(access, position);
        
        this.annotations = annotations;
        
        /** @type {Identifier} */
        this.name = name;
        
        /** @type {FunctionArgument[]} */
        this.args = args || [];
        
        /** @type {Type} */
        this.returnType = returnType;
        
        /** @type {Node[]} */
        this.statements = statements;
        
        /**
         * For generation, stores register index.
         * @type {number}
         */
        this.registerIndex = 0;
    }
    
    /** @override */
    get identifierPath() {
        return this.name;
    }
    
    /** @override */
    get children() {
        return ['annotations', 'name', 'args', 'returnType', 'statements'];
    }
    
    /** @override */
    toString() {
        return `${this.annotations.join("\n") + (this.annotations.length?" ":"")}` +
            `${this.access.join(" ")}${this.access.length ? " " : ""}` +
            `func ${this.name}(${this.args.join(", ")})` +
            `${this.returnType ? " -> " + this.returnType : ""} ${this.statements}`
    }
}
