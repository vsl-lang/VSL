import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

/**
 * Represents a generic parameter in a class. This cannot resolve to a type.
 * Instead you must contextually determine this value through negotiation.
 */
export default class GenericParameterItem extends ScopeItem {

    /**
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     * @param {ScopeTypeItem|Node} data.item - Referenced item.
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @protected */
    init({ item, ...opts }) {
        super.init(opts);

        // The actual class/type this refers to
        this._ref = item;
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
        return this._ref.resolved();
    }
}
