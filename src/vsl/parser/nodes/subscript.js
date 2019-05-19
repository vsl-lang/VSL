import FunctionCall from './functionCall';

/**
 * Matches a subscript expression inside a PropertyExpression
 *
 * @example
 * head[tail]
 */

export default class Subscript extends FunctionCall {
    /**
     * Creates a subscript
     *
     * @param {Expression} head the object to subscript
     * @param {ArgumentCall[]} args the provided expression
     * @param {Object} position a position from nearley
     */
    constructor(head, args, position) {
        super(head, args, position);

        /**
         * Always true because subscript relationships are implicit.
         * @type {bool}
         */
        this.implicitMethodReference = true;
    }

    clone() {
        return new Subscript(
            this.head.clone(),
            this.arguments.clone()
        )
    }

    /** @override */
    get children () {
        return ['head', 'arguments'];
    }

    /** @override */
    toString() {
        return `${this.head}[${this.arguments.join(", ")}]`;
    }
}
