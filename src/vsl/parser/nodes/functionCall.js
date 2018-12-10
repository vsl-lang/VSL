import Node from './node';

/**
 * Matches a function call inside a PropertyExpression
 *
 * @example
 * head(argument)
 */

export default class FunctionCall extends Node {
    /**
     * Creates a function call
     *
     * @param {Expression} head the function to call
     * @param {ArgumentCall[]} args the provided arguments
     * @param {Object} position a position from nearley
     */
    constructor (head: Expression, args: ArgumentCall[], position: Object) {
        super(position);

        /** @type {Expression} */
        this.head = head;

        /** @type {ArgumentCall[]} */
        this.arguments = args;

        /**
         * @type {ScopeFuncItem}
         */
        this.reference = null;

        /**
         * Resolved return type. Different than `this.reference.returnType` in
         * the case of generics. This is the same as
         * `this.reference.returnType.selfType.contextualType(this.typeContext)`
         * for inits.
         * @type {?ScopeTypeItem}
         */
        this.returnType = null;

        /**
         * List of indexes treated as optional.
         * @type {number[]}
         */
        this.argPositionsTreatedOptional = [];

        /**
         * The type context with which this is resolved with.
         * @type {?TypeContext}
         */
        this.typeContext = null;
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
