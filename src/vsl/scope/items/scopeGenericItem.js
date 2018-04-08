import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

import ScopeTypeItem from './scopeTypeItem';

/**
 * Describes a declaration of a type.
 */
export default class ScopeGenericItem extends ScopeTypeItem {
    /**
     * Creates a generic type. This is like ScopeTypeItem except that it also
     * stores the generic parents.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {ScopeTypeItemOptions} data - Information about the class
     * @param {ScopeTypeItem[]} data.genericParents - A series of parents
     *     which match the generic templates.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);
    }

    /** @protected */
    init({
        genericParents,
        ...options
    } = {}) {
        super.init(options);
        this.genericParents = genericParents;
    }

    /** @return {string} */
    toString() {
        return this.rootId + `<${this.genericParents.join(", ")}>`
    }
}
