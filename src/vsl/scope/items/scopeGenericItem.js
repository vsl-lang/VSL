import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

/**
 * Represents a generic class
 */
export default class ScopeGenericItem extends ScopeItem {
    /**
     * Creates a generic type. This is like ScopeTypeItem except that it also
     * stores the generic parents.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {ScopeTypeItemOptions} data - Information about the class
     * @param {TemplateSpecialization[]} data.genericParents - A series of parents
     *     which match the generic templates.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);

        /** @type {TemplateSpecialization[]} */
        this.specializations;
    }

    /** @protected */
    init({
        genericParents,
        ...options
    } = {}) {
        super.init(options);

        this.genericParents = genericParents;
        this.specializations = [];
    }

    /** @return {string} */
    toString() {
        return this.rootId + `<${this.genericParents.join(", ")}>`
    }
}
