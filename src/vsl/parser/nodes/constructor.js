import Node from './node'

/**
 * Matches a class initializer/constructor.
 */
export default class Constructor extends Node {
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
        super(position);
        /** @type {string} */
        this.access = access;
        /** @type {boolean} */
        this.optional = optional;
        /** @type {FunctionArgument[]} */
        this.params = params;
        /** @type {CodeBlock} */
        this.statments = statements;
    }

    /** @override */
    get children() {
        return ['access', 'optional', 'params', 'statements'];
    }

    /** @override */
    toString() {
        return `${this.access ? this.access + " " : ""}init` +
            `${this.optional ? "?" : ""}(${this.args.join(", ")})` +
            `{${this.statements.toString()}}`;
    }
}
