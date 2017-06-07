import Node from './node';

/**
 * Wraps an interfcae
 * 
 */
export default class InterfaceStatement extends Node {

    /**
     * Constructs a generic function statement
     * 
     * @param {string[]} access - The access modifiers of the node
     * @param {Identifier} name - The name of the interface
     * @param {Identifier[]} superclasses - The superclasses to inherit or implement
     * @param {Node[]} statements - The interface's body
     * @param {Annotation[]} annotations - The annotations of the interface
     * @param {Object} position - a position from nearley
     */
    constructor(
        access: string[],
        name: Identifier,
        superclasses: Identifier[],
        statements: Node[],
        annotations: Annotation[],
        position: Object
    ) {
        super(position);

        /** @type {string[]} */
        this.access = access;
        /** @type {Identifier} */
        this.name = name;
        /** @type {Identifier[]} */
        this.superclasses = superclasses;
        /** @type {Node[]} */
        this.statements = statements === null ? new CodeBlock([]) : statements;
        /** @type {Annotation[]} */
        this.annotations = annotations || [];
    }

    /** @override */
    get children() {
        return ['name', 'superclasses', 'statements'];
    }
}
