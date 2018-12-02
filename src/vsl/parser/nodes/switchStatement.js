import Node from './node';

/**
* Switch statement
*/
export default class SwitchStatement extends Node {

    /**
     * @param {ExpressionStatement} value - The value of switch
     * @param {CodeBlock} body - Body with switch cases
     * @param {Object} position a position from nearley
     */
    constructor(value, body, position) {
        super(position);

        /** @type {ExpressionStatement} */
        this.value = value;

        /** @type {CodeBlock} */
        this.body = body;
    }

    clone() {
        return new SwitchStatement(this.value, this.body);
    }

    /** @override */
    get children() {
        return ['value', 'body'];
    }

    /** @override */
    toString() {
        return `switch ${this.value} ${this.body}`;
    }
}
