import Node from './node';

/**
 * Matches a Generic `A<B>` in a generic **reference** (i.e. in a type
 * expression).
 */
export default class Generic extends Node {

    /**
     * Creates a generic
     * @param  {Identifier} type - name of generic
     * @param  {Node[]} parameters - Generic type params
     * @param  {Object} position - Position object from nearley
     */
    constructor(
        type: Identifier,
        parameters: Identifier[],
        position: Object
    ) {
        super(position);

        /** @type {Identifier} */
        this.head = type;

        /** @type {Node[]} */
        this.parameters = parameters;
    }

    clone() {
        return new Generic(
            this.type.clone(),
            this.parameters.map(param => param.clone())
        )
    }

    /** @override */
    get children() {
        return ['head', 'parameters'];
    }

    /** @override */
    toString() {
        return `${this.head}<${this.parameters.join(", ")}>`
    }
}
