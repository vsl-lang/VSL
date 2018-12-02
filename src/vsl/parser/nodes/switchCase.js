import Node from './node';

/**
* Switch case
*/
export default class SwitchCase extends Node {

    /**
     * @param {ExpressionStatement} condition - case cond
     * @param {CodeBlock} body - Body with switch cases
     * @param {Object} position a position from nearley
     */
    constructor(condition, body, position) {
        super(position);

        /** @type {ExpressionStatement} */
        this.condition = condition;

        /** @type {CodeBlock} */
        this.body = body;
    }

    clone() {
        return new SwitchDefaultCase(this.body);
    }

    /** @override */
    get children() {
        return ['condition', 'body'];
    }

    /** @override */
    toString() {
        return `case ${condition} ${this.body}`;
    }
}
