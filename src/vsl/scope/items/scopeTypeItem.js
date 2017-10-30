import ScopeForm from '../scopeForm';
import ScopeItem from '../scopeItem';

/**
 * Describes a declaration of a type.
 */
export default class ScopeTypeItem extends ScopeItem {
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
     */
    constructor(form, rootId, options) {
        super(form, rootId, options);
    }

    /** @protected */
    init({
        interfaces = [],
        isGeneric = false,
        superclass = ScopeTypeItem.RootClass,
        isInterface = false
    } = {}) {
        this.interfaces = interfaces;
        this.superclass = superclass;
    }
    
    /**
     * Determines if `type` is castable.
     * @param {ScopeTypeItem} type - If the current type can be cast to this
     *                             type.
     * @return {boolean} if it can be cast/
     */
    castableTo(type) {
        type = type.resolved();
        
        // Check if cast to the same type
        if (type === this) return true;
        
        // Check if casting to new type
        if (this.superclass?.castableTo(type)) return true;
        for (let i = 0; i < this.interfaces; i++) {
            if (this.interfaces[i].castableTo(type)) return true;
        }
        
        return false;
    }

    /**
     * The default classes all items inherit from.
     */
    static RootClass = do {
        new ScopeTypeItem(ScopeForm.definite, "Object", {
            superclass: null
        });
    }

    /** @return {string} */
    toString() {
        return `${this.isInterface ? "interface" : "class"} ${this.rootId}`
    }
}
