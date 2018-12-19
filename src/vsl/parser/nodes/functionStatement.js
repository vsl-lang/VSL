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
     * @param {?Type} returnType - The function's returnType.
     * @param {boolean} isGenerator - If the function yields instead of returning.
     * @param {CodeBlock} statements - The statements in the function body.
     * @param {Object} position - a position from nearley
     */
    constructor(
        annotations: Annotation[],
        access: string[],
        name: Identifier,
        args: FunctionArgument[],
        returnType: Type,
        isGenerator: boolean,
        statements: Node[],
        position: Object
    ) {
        super(access, name.position);

        /** @type {Annotation[]} */
        this.annotations = annotations;

        /** @type {Identifier} */
        this.name = name;

        /** @type {FunctionArgument[]} */
        this.args = args || [];

        /** @type {?Type} */
        this.returnType = returnType;

        /** @type {?Type} */
        this.isGenerator = isGenerator;

        /** @type {?ScopeTypeItem} */
        this.returnRef = null;

        /** @type {?(ScopeTypeItem[])} */
        this.argRefs = [];

        /** @type {?ScopeFuncItem} */
        this.reference = null;

        /** @type {CodeBlock} */
        this.statements = statements;
    }

    clone() {
        return new FunctionStatement(
            this.annotations.map(annotation => annotation.clone()),
            this.access.slice(),
            this.name.clone(),
            this.args.map(arg => arg.clone()),
            this.returnType?.clone(),
            this.statements.clone()
        )
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
