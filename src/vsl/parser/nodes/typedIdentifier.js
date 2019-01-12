import Node from './node';

/**
 * Represents an identifier and it's associated type. This node is usually used
 * for variable delcarations and such where a type is intrinsic to the parent
 * node.
 *
 * `type` may be null and in that case the parent can specify for the type
 * inferrer to infer the type. The identifier
 *
 */
export default class TypedIdentifier extends Node {

    /**
     * Creates an identifier
     *
     * @param {Node} identifier - the identifier
     * @param {Type} type - the type of the identifier
     * @param {Object} position - a position from nearley
     */
    constructor (identifier: string, type: Type, position: Object) {
        super(position);

        /** @type {Node} */
        this.identifier = identifier;

        /** @type {Type} */
        this.type = type || null;
    }

    /** @override */
    get children() {
        return ['identifier', 'type'];
    }

    /** @override */
    toString() {
        return `${this.identifier}${this.type ? ": " + this.type : ""}`;
    }
}
