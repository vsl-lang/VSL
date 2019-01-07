import DeclarationStatement from './declarationStatement';

/**
 * Wraps a class
 */
export default class ClassStatement extends DeclarationStatement {

    /** @override */
    get fancyName() { return "class" }

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

        /** @type {?ScopeTypeItem} */
        this.reference = null;

        /**
         * Associated mock type attribute
         * @type {?string}
         */
        this.mockType = null;
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
    toString() {
        return `${this.annotations.join("\n") + (this.annotations.length?" ":"")}`+
        `${this.access.join(" ")}${this.access.length ? " " : ""}class` +
        ` ${this.name}: ${
            this.superclasses.length === 0 ?
            "Object" : this.superclasses.join(", ")
        } ${this.statements}`
    }

    /** @override */
    get children() {
        return ['name', 'generics', 'superclasses', 'statements', 'annotations'];
    }
}
