import Node from './node';

/**
 * Matches a deelgation to another init
 */

export default class InitDelegationCall extends Node {
    /**
     * Creates an init delegation call.
     *
     * @param {Self|Super} head self or super dependening on type
     * @param {ArgumentCall[]} args each arg of function.
     * @param {Object} position a position from nearley
     */
    constructor (head: Expression, args: ArgumentCall[], position: Object) {
        super(position);

        /** @type {Self|Super} */
        this.head = head;

        /** @type {ArgumentCall[]} */
        this.arguments = args;

        /**
         * @type {ScopeFuncItem}
         */
        this.reference = null;
    }

    clone() {
        return new FunctionCall(
            this.head.clone(),
            this.arguments.map(arg => arg.clone())
        )
    }

    /** @override */
    get children () {
        return ['head', 'arguments'];
    }

    /** @override */
    toString() {
        return `${this.head}(${this.arguments.join(', ')})`;
    }
}
