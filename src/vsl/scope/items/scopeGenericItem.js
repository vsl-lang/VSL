import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';

/**
 * Describes a declaration of a type.
 */
export default class ScopeGenericItem extends ScopeTypeItem {
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
     * @param {?(ScopeTypeItem[])} data.interfaces - Types which this can safely
     *     be cast to. We'll assume that you've done all the checks because if
     *     something is wrong here expect big giant segfaults. If you have a
     *     superclass, specified it'll just go in the superclass field.
     *     Interfaces go here for example.
     * @param {?(ScopeTypeItem[])} data.genericParents - A series of parents
     *     which match the generic templates.
     * @param {?ScopeTypeItem} data.superclass - The superclass (not interface)
     *     of the current class, don't specify if there is none. You don't need
     *     to resolve inheritance or anything. This is null for interfaces.
     * @param {boolean} data.isInterface - Whether the type is an interface.
     *     This is used to determine how casting will occur and dynamic dispatch
     *     so ensure that it is not possible to declare fields.
     * @param {ScopeItemResolver} data.resolver - Function to resolve if node.
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);
    }

    /** @protected */
    init({
        genericParents, ...options
    } = {}) {
        super.init(options);
        this.genericParents = genericParents;
        this.types = new Set();
    }
    
    /**
     * Notifies that this generic was used with a types.
     * @param  {ScopeTypeItem[]} types - The generic types this was used with.
     */
    usedWith(types) {
        let typeList = types.map(type => type.resolved());
        
        main: for (let existingType of this.types) {
            if (existingType.length === types.length) {
                for (let i = 0; i < existingType.length; i++) {
                    if (existingType[i] !== typeList[i]) {
                        continue main;
                    }
                }
                
                // Already added
                return;
            }
        }
        
        this.types.add(typeList);
    }

    /** @return {string} */
    toString() {
        return super.toString() + `<<Generic>>`
    }
}
