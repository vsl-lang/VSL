import Node from './node';

/**
 * Represents parameter for tuples
 */
export default class TupleTypeParameter extends Node {

    /**
     * @param {Identifier} name - parameter name
     * @param {Type} type - type of param
     * @param {Object} position - A position for nearley
     */
    constructor(name, type, position) {
        super(position);

        /**
         * The parameter name
         * @type {Identifier}
         */
        this.name = name;

        /**
         * Type of param
         * @type {Type}
         */
        this.type = type;
    }

    /** @override */
    get children() {
        return ['name', 'type'];
    }

    /** @override */
    toString() {
        return `${this.name}: ${this.type}`;
    }

}
