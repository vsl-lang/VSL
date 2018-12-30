import Node from './node';

/**
 * Matches a getter
 */

export default class Getter extends Node {
    /**
     * Creates a getter
     *
     * @param {CodeBlock} body The body of getter
     * @param {Object} position a position from nearley
     */
    constructor(body, position) {
        super(position);

        /** @type {CodeBlock} */
        this.body = body;
    }

    /** @override */
    get children () {
        return ['body'];
    }

    /** @override */
    toString() {
        return `get ${this.body}`;
    }
}
