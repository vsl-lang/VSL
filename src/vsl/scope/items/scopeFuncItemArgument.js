import ScopeTypeItem from './scopeTypeItem';
import ScopeError from '../scopeError';

/**
 * Represents an argument for a function scope item.
 */
export default class ScopeFuncItemArgument {
    /**
     * Creates a scope func item argument given various details. If a type has a
     * default value for the param, mark that parameter as optional if
     * applicable, meaning that it does not create any conflicts.
     *
     * @param  {string} name     The name of the function argument, leave
     *                           empty if there is none
     * @param {ScopeTypeItem} type The type of the argument, if it is an
     *                             optional, mark the next param as so.
     * @param  {bool}   optional Whether the argument is optional, if the
     *                           argument has a default value, then you may mark
     *                           this.
     * @param {Node}    node     The node in which the ScopeFuncItemArgument
     *                           was declared, this is used for deffered
     *                           resolution
     */
    constructor(name, type, optional, node) {
        /** @type {string} */
        this.name = name;

        /** @type {bool} */
        this.optional = optional;

        /**
         * The type of the argument, use `getArg` as this may be unresolved
         * @type {ScopeTypeItem|string}
         * @protected
         */
        this.type = type;

        /** @private */
        this.node = node;
    }

    /**
     * Gets the type at the index, performs resolution if needed because cannot
     * always be done on the first pass.
     *
     * @return {ScopeTypeItem}    The resolved ScopeTypeItem, this will throw if
     *                            a bork occurs (such as no type existing).
     */
    getType() {
        if (typeof this.type === "string") {
            let res = this.node.parentScope.scope.get(new ScopeTypeItem(this.type));
            if (res === null) {
                throw new ScopeError(
                    `\`${this.node}\` is not a type.`,
                    this.node
                );
            }
        } else {
            return this.type;
        }
    }

    /**
     * Checks if same as another {@link ScopeFuncItemArgument}
     * @param {ScopeFuncItemArgument} ref - Other item
     * @return {boolean} true if same.
     */
    equal(ref) {
        let root = this.type.resolved();
        let match = ref.type.resolved();

        if (match === root) return true;
    }

    /** @override */
    toString() {
        return `${this.name || "*"}: ${this.type}${this.optional ? "?" : ""}`;
    }
}
