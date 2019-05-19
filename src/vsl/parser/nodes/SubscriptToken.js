import Node from './node';

export default class SubscriptToken extends Node {

    /**
     * Represents a subscript node
     *
     * @param {Object} position a position from nearley
     */
    constructor(position) {
        super(position);

        /**
         * Always equal to 'subscript'
         * @type {string}
         */
        this.value = 'subscript';
    }

    /** @override */
    get children() {
        return null;
    }

    /** @override */
    toString() {
        return `subscript`;
    }
}
