import Node from './node';

/**
* Switch default case
*/
export default class SwitchDefaultCase extends Node {

    /**
     * @param {CodeBlock} body - Body with switch cases
     * @param {Object} position a position from nearley
     */
    constructor(body, position) {
        super(position);

        /** @type {CodeBlock} */
        this.body = body;
    }

    clone() {
        return new SwitchDefaultCase(this.body);
    }

    /** @override */
    get children() {
        return ['body'];
    }

    /** @override */
    toString() {
        return `default ${this.body}`;
    }
}
