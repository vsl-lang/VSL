import DeclarationStatement from './declarationStatement'

/**
 * Matches a class initializer/constructor.
 */
export default class InitializerStatement extends DeclarationStatement {
    /**
     * Constructs the constructor. A constructor that constructs a constructor
     * is also known as constructorception.
     *
     * @param {string} access the access level of the constructor
     * @param {boolean} optional true if this constructor can return a null
     *     value
     * @param {FunctionArgument[]} params the parameters that this constructor
     *     can take
     * @param {CodeBlock} statements the body of the constructor
     * @param {Object} position a position from nearley
     */
    constructor(
        access: string,
        optional: boolean,
        params: FunctionArgument[],
        statements: CodeBlock,
        position: Object
    ) {
        super(access, position);
        
        /** @type {boolean} */
        this.optional = optional;
        
        /** @type {FunctionArgument[]} */
        this.params = params;
        
        /** @type {CodeBlock} */
        this.statements = statements;
    }

    clone() {
        return new InitializerStatement(
            this.access.slice(),
            this.optional,
            this.params.map(param => param.clone()),
            this.statements.clone()
        );
    }

    /** @override */
    get children() {
        return ['params', 'statements'];
    }

    /** @override */
    toString() {
        return `${this.access ? this.access + " " : ""}init` +
            `${this.optional ? "?" : ""}(${this.params.join(", ")}) ` +
            `${this.statements.toString()}`;
    }
}
