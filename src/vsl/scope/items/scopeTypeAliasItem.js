import ScopeItem from '../scopeItem';

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
     * @param {ScopeTypeItem} data.item - Referenced item.
     */
    constructor(form, rotoId, data) {
        super(form, rootId, data);
    }
    
    /** @protected */
    init({ item }) {
        this._ref = item;
    }

    /** @return {string} */
    toString() {
        return `${this.rootId} -> ${this._ref}`;
    }
    
    /**
     * Resolves a {@link ScopeItem} to its canolical form.
     * @return {ScopeItem} normalized etc.
     */
    resolved() {
        return this._ref;
    }
}
