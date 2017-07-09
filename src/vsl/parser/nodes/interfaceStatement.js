import DeclarationStatement from './declarationStatement';

/**
 * Wraps an interfcae
 *
 */
export default class InterfaceStatement extends DeclarationStatement {

    /** @override */
    get fancyName() { return "interface" }

    /**
     * Constructs a generic function statement
     *
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the interface
     * @param {Identifier[]} superclasses - The superclasses to inherit or implement
     * @param {CodeBlock} statements - The interface's body
     * @param {Annotation[]} annotations - The annotations of the interface
     * @param {Object} position - a position from nearley
     */
    constructor(
        access: string[],
        name: Identifier,
        superclasses: Identifier[],
        statements: CodeBlock,
        annotations: Annotation[],
        position: Object
    ) {
        super(access, position);

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
    get children() {
        return ['name', 'superclasses', 'statements'];
    }
}
