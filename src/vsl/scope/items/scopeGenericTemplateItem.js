import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';

/**
 * Represents a template referencing instanceof a {@link ScopeGenericItem}. You
 * can fork this from the original generic.
 */
export default class ScopeGenericTemplateItem extends ScopeTypeItem {
    /**
     * Creates an intenral declaration of a type. When passing the "subscope",
     * don't create a new one or anything, just pass the `CodeBlock`'s `Scope`
     * that your node has. If for some weird reason you need to create a scope,
     * don't set the `parentScope` of the scope, the `superclass` attribute will
     * do that for you.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     * @param {?(ScopeTypeItem[])} data.template - Base generic class being
     *                                           derived in the given instance.
     * @param {?(ScopeTypeItem[])} data.parents - Applied parents, these should
     *                                          be verified that they match.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);
    }

    /** @protected */
    init({
        template, parents, ...options
    } = {}) {
        super.init(options);

        this.template = template;
        this.parents = parents;
    }

    /** @return {string} */
    toString() {
        return this.template.rootToString() + `<${this.genericParents.map(p => p.toString()).join(", ")}>`
    }
}
