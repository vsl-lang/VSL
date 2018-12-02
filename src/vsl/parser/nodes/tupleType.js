import Node from './node';

/**
 * Tuple type.
 */
export default class TupleType extends Node {

    /**
     * @param {TupleTypeParameter[]} params - parameters
     * @param {Object} position - A position for nearley
     */
    constructor(params, position) {
        super(position);

        /**
         * The parameter name
         * @type {TupleTypeParameter[]}
         */
        this.params = params;
    }

    /** @override */
    get children() {
        return ['params'];
    }

    /** @override */
    toString() {
        return `(${this.params.join(", ")})`;
    }

}
