import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';

/**
 * Represents a generic class. Extends {@link ScopeTypeItem} but offers a list
 * of generic parent types.
 */
export default class ScopeGenericItem extends ScopeTypeItem {
    /**
     * Creates a generic type. This is like ScopeTypeItem except that it also
     * stores the generic parents.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {ScopeTypeItemOptions} data - Information about the class
     * @param {GenericInfo} data.genericInfo - Informatino about the generic
     *   class.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);

        /** @type {GenericInfo} */
        this.genericInfo;
    }

    /** @protected */
    init({
        genericInfo,
        ...options
    } = {}) {
        super.init(options);

        this.genericInfo = genericInfo;
    }

    /** @return {string} */
    toString() {
        return this.rootId + genericInfo.toString();
    }
}
