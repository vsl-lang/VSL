import Node from './node';

/**
 * Matches an 'do-while' loop statement.
 */
export default class DoWhileStatement extends Node {
    /**
     * Creates a while-statement
     *
     * @param {Expression} condition - The condition to check
     * @param {CodeBlock} body - The body of the while statement
     * @param {Object} position - A position from nearley
     */
    constructor(condition, body, position) {
        super(position);

        /** @type {Expression} */
        this.condition = condition;

        /** @type {body} */
        this.body = body;
    }

    /** @override */
    get children() {
        return ['condition', 'body'];
    }

    toString() {
        return `do ${this.body} while ${this.condition}`
    }
}
