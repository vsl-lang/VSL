import ScopeForm from './scopeForm';

let mangleId = 1;

/**
 * A generic scope item, specifying primarially the value of any identifier.
 * This specifies behavior for type matching and also getting and setting the
 * scope item, used for type checking. It should hold information and be
 * compliant for type inference if applicable.
 *
 * This has two forms:
 *  - Indefinite
 *  - Definite
 *  - Query
 *
 * Some scope items are always definite. Check the static
 * {@link ScopeItem.alwaysDefinite} property.
 *
 * See {@link ScopeForm}
 *
 * @abstract
 */
export default class ScopeItem {
    /**
     * True if type is always definite
     * @type {Boolean}
     */
    static alwaysDefinite = false;

    /**
     * Creates a ScopeItem with a specific form and name.
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {?Object} data - See {@link ScopeItem#init} for info.
     * @param {ScopeItemResolver} data.resolver - Function to resolve if node.
     */
    constructor(form, rootId, data = {}) {
        /**
         * The form of the scope item.
         * @type {ScopeForm}
         */
        this.form = form;

        /**
         * The string name of the scope item
         *
         * @type {string}
         */
        this.rootId = rootId;

        /**
         * All items which reference this scope item. Avoid directly writing
         * to and instead use {@link Scope#getAsDelegate}
         *
         * @readonly
         * @type {Node[]}
         */
        this.references = [];

        /**
         * For {@link ScopeForm.query} objects. This will contain query data.
         * @protected
         * @type {Object}
         */
        this.query = null;

        if (form === ScopeForm.query) {
            this.query = data;
        } else {
            this.init(data);
        }

        /**
         * Random ID uniquely id'ing item in scope
         * @type {[type]}
         */
        this.id;
    }

    /**
     * Called to initalize type with object.
     * @param {ScopeItemResolver} resolver - Function to resolve if node.
     * @abstract
     */
    init({ resolver = null }) {
        this._resolver = resolver;

        this.id = mangleId++;
    }

    /**
     * Determines whether two `ScopeItem`s matches each other. You can use this
     * to verify a candidate matches the prototype. Always implement
     * `super.equal` as first condition.
     *
     * @param {ScopeItem} ref - The value of the other scope item. It will
     *     be of the same subclass. Must be **query** type.
     * @return {bool} Indicates whether or not the `signature` is the same.
     *
     * @abstract
     */
    equal(ref: ScopeItem): boolean {
        return ref.rootId === this.rootId;
    }

    /**
     * Resolves the current node using a passed resolver
     */
    resolve() {
        if (this.form === ScopeForm.indefinite) {
            this._resolver?.(this);
            this.form = ScopeForm.definite;
        }
    }

    /**
     * Resolves a {@link ScopeItem} to its canolical object.
     * @return {ScopeItem} normalized etc.
     * @abstract
     */
    resolved() {
        this.resolve();
        return this;
    }

    /**
     * Returns a query for the current {@link ScopeItem}
     * @return {ScopeItem} of type Query.
     */
    getQuery() {
        return new (this.constructor)(ScopeForm.query, this.rootId, {});
    }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `${this.rootId}.$${this.id}`
    }
}
