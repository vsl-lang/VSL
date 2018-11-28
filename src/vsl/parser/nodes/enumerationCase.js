import Node from './node';

/**
 * Matches a `case foo` in an enumeration statement.
 */
export default class EnumerationCase extends Node {

    /**
     * Creates an enumeration case.
     *
     * @param {Identifier} name - The name of the enumeration case
     * @param {Object} position a position from nearley
     */
    constructor(name, position) {
        super(position);

        /**
         * Name of enum
         * @type {Identifier}
         */
        this.name = name;
    }

    /** @override */
    get children() {
        return ['name'];
    }

    clone() {
        return new EnumerationCase(this.name.clone());
    }

    /** @override */
    toString() {
        return `case ${this.name}`;
    }
}
