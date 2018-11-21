import Node from './node'

/**
 * Matches a class deinit
 */
export default class DeinitializerStatement extends Node {
    /**
     * An explicit deintializer for a class.
     *
     * @param {CodeBlock} body the access level of the constructor
     * @param {Object} position a position from nearley
     */
    constructor(body, position) {
        super(position);

        /** @type {CodeBlock} */
        this.body = body;
    }

    clone() {
        return new DeinitializerStatement(
            this.body.clone()
        );
    }

    /** @override */
    get children() {
        return ['body'];
    }

    /** @override */
    toString() {
        return `deinit ${this.body}`;
    }
}
