import ScopeTypeItem from './scopeTypeItem';

/**
 * Specifies that a given type reference is a generic parameter and should be
 * adjusted depending on context
 */
export default class GenericTypeReferenceItem extends ScopeTypeItem {
    init({ type, ...opts }) {
        super.init(opts);

        this._type = type;
    }

    /**
     * Resolves a type reference
     * @return {ScopeItem} normalized, etc.
     */
    resolved() {
        this.resolve();
        return this._type.resolved();
    }
}
