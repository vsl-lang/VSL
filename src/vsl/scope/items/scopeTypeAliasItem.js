import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';
import GenericTypeReferenceItem from './GenericTypeReferenceItem';

/**
 * Represents a Type Alias. You can use {@link ScopeTypeAliasItem#resolve} to
 * resolve this.
 */
export default class ScopeTypeAliasItem extends ScopeItem {

    /**
     * Creates at type alias for a type. This will act like the aliased type. If
     * you pass a this to a serach you may get back the original.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     * @param {ScopeTypeItem|Node} data.item - Referenced item.
     * @param {ScopeItemResolver} data.resolver - Function to resolve if node.
     * @param {boolean} data.isGenericItem - if the item is a generic parameter
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);

        /** @type {?Node} */
        this.source;
    }

    /** @protected */
    init({ item, source = null, isGenericItem = false, ...opts }) {
        super.init(opts);
        this._ref = item;
        this.source = source;
        this.isGenericItem = isGenericItem;
    }

    /** @return {string} */
    toString() {
        return `${this.rootId} -> ${this._ref}`;
    }

    /** @override */
    clone(opts) {
        super.clone({
            item: this._ref,
            source: source,
            ...opts
        });
    }

    /**
     * Resolves a {@link ScopeItem} to its canolical form.
     * @return {ScopeItem} normalized etc.
     */
    resolved() {
        this.resolve();
        if (this.isGenericItem) {
            return new GenericTypeReferenceItem(ScopeForm.definite, this.rootId, {
                type: this._ref
            });
        } else {
            return this._ref.resolved();
        }
    }
}
