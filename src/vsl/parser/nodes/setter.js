import Node from './node';

/**
 * Matches a setter
 */

export default class Setter extends Node {
    /**
     * Creates a setter
     *
     * @param {Identifier} parameter - Setter parameter parameter
     * @param {CodeBlock} body The body of setter
     * @param {Object} position a position from nearley
     */
    constructor(parameter, body, position) {
        super(position);

        /** @type {Identifier} */
        this.parameter = parameter;

        /** @type {CodeBlock} */
        this.body = body;

        /** @type {?ScopeAliasArgItem} */
        this.parameterRef = null;
    }

    /** @override */
    get children () {
        return ['parameter', 'body'];
    }

    /** @override */
    toString() {
        return `set(${this.parameter}) ${this.body}`;
    }
}
