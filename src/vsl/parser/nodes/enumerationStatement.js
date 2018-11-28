import DeclarationStatement from './declarationStatement';

/**
 * Wraps an enum.
 */
export default class EnumerationStatement extends DeclarationStatement {

    /** @override */
    get fancyName() { return "enumeration"; }

    /**
     * Constructs a generic class statement
     *
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the class
     * @param {TypeDeclaration[]} generics - Generic templates of the class.
     * @param {Identifier[]} superclasses - The superclasses to inherit or implement
     * @param {CodeBlock} statements - The class's body
     * @param {Annotation[]} annotations - The annotations of the class
     * @param {Object} position - a position from nearley
     */
    constructor(access, name, statements, annotations, position) {
        super(access, position);

        /** @type {Identifier} */
        this.name = name;

        /** @type {CodeBlock} */
        this.statements = statements;

        /** @type {Annotation[]} */
        this.annotations = annotations || [];
    }

    clone() {
        return new EnumerationStatement(
            this.access.slice(),
            this.name.clone(),
            this.statements.clone(),
            this.annotations.map(annotation => annotation.clone())
        )
    }

    /** @override */
    toString() {
        return `${this.annotations.join("\n") + (this.annotations.length?" ":"")}`+
        `${this.access.join(" ")}${this.access.length ? " " : ""}enum` +
        ` ${this.name} ${this.statements}`
    }

    /** @override */
    get children() {
        return ['name', 'statements', 'annotations'];
    }
}
