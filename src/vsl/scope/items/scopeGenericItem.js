import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

import ScopeGenericTemplateItem from './scopeGenericTemplateItem';

/**
 * Describes a declaration of a type.
 */
export default class ScopeGenericItem extends ScopeItem {
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
     * @param {ScopeTypeItemOptions} data.scopeTypeItem - The root type item
     *                                                  options for this generic
     *                                                  declaration.
     * @param {ScopeTypeItem[]} data.genericParents - A series of parents
     *     which match the generic templates.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);
    }

    /** @protected */
    init({
        genericParents,
        scopeTypeItem,
        ...options
    } = {}) {
        super.init(options);
        this.scopeTypeItem = scopeTypeItem;
        this.genericParents = genericParents;
        this.types = new Set();
    }
    
    /**
     * Notifies that this generic was used with a types.
     * @param  {ScopeTypeItem[]} types - The generic types this was used with.
     *                                 These must be resolved + verified to fit.
     * @return {ScopeGenericTemplateItem} Resolved subclass of a ScopeTypeItem,
     *                                    do NOT add this to a scope.
     */
    usedWith(types) {
        main: for (let existingType of this.types) {
            if (existingType.length === types.length) {
                for (let i = 0; i < existingType.length; i++) {
                    if (existingType[i] !== typeList[i]) {
                        continue main;
                    }
                }
                
                // Already added
                return existingType;
            }
        }
        
        let genericParamString = types.map(type => type.toString()).join(", ");
        
        // Create and add new ScopeGenericTemplateItem
        let newType = new ScopeGenericTemplateItem(
            ScopeForm.definite,
            `${this.rootId}<genericParamString>`,
            {
                template: this,
                parents: types,
                ...this.scopeTypeItem
            }
        )
        this.types.add(newType);
        return newType;
    }

    /**
     * Root name of generic
     * @type {string}
     */
    rootToString() {
        return super.toString();
    }
    
    /** @return {string} */
    toString() {
        return this.rootToString() + `<<Generic>>`
    }
}
