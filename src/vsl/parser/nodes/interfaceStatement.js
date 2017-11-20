import DeclarationStatement from './declarationStatement';

/**
 * Wraps an interfcae
 */
export default class InterfaceStatement extends DeclarationStatement {

    /** @override */
    get fancyName() { return "interface" }

    /**
     * Constructs a generic function statement
     *
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the interface
     * @param {TypeDeclaration[]} generics - Generic templates of the interfaces.
     * @param {Identifier[]} superclasses - The superinterfaces to inherit or implement
     * @param {CodeBlock} statements - The interface's body
     * @param {Annotation[]} annotations - The annotations of the interface
     * @param {Object} position - a position from nearley
     */
    constructor(access, name, generics, superclasses, statements, annotations, position) {
        super(access, position);

        /** @type {Identifier} */
        this.name = name;

        /** @type {TypeDeclaration[]} */
        this.generics = generics;

        /** @type {Identifier[]} */
        this.superclasses = superclasses || [];

        /** @type {CodeBlock} */
        this.statements = statements;

        /** @type {Annotation[]} */
        this.annotations = annotations || [];
    }

    clone() {
        return new ClassStatement(
            this.access.slice(),
            this.name.clone(),
            this.generics.map(generic => generic.clone()),
            this.superclasses.map(superclass => superclass.clone()),
            this.statements.clone(),
            this.annotations.map(annotation => annotation.clone())
        )
    }

    /** @override */
    get children() {
        return ['name', 'generics', 'superclasses', 'statements', 'annotations'];
    }
}
