import Node from './node';

/**
 * Matches an 'for' loop statement.
 */
export default class ForStatement extends Node {
    /**
     * Creates a for-statement
     *
     * @param {Identifier[]} parameterList - Parameter list \
     * @param {Expression} iterator - Expression to iterate.
     * @param {CodeBlock} body - The body of the while statement
     * @param {Object} position - A position from nearley
     */
    constructor(parameterList, iterator, body, position) {
        super(position);

        /** @type {Identifier[]} */
        this.parameterList = parameterList;

        /** @type {Expression} */
        this.iterator = iterator;

        /** @type {body} */
        this.body = body;
    }

    /** @override */
    get children() {
        return ['parameterList', 'iterator', 'body']
    }

    toString() {
        return `for ${parameterList.join(", ")} in ${this.condition} ${this.body}`
    }
}
