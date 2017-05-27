import ScopeItem from '../scopeItem';

/**
 * Describes a declaration of a type.
 */
export default class ScopeTypeItem extends ScopeItem {
    /**
     * Creates an intenral declaration of a type.
     * 
     * @param {string} rootId - The root primary identifier of this type.
     * @param {Scope} subscope - All items in the class's scope
     * @param {Object} data - Information about the class
     * @param {ScopeTypeItem[]} data.castables - Types which this can safely be cast to
     * @param {ScopeTypeItem} data.superclass - don't specify if there is none
     * @param {boolean} data.isInterface - Whether the type is an interface.
     */
    constructor(
        rootId: string,
        subscope: Scope,
        {
            castables = [],
            superclass = ScopeTypeItem.RootClass,
            isInterface = false
        }
    ) {
        super(rootId);
        
        this.isInterface = isInterface;
        
        this.castsables = castables;
        this.superclass = superclass;
        
        this.subscope = subscope;
    }
    
    /** @override */
    equal(ref: ScopeItem): boolean {
        return ref instanceof ScopeTypeItem && ref.rootId === this.rootId; 
    }
    
    /**
     * The default classes all items inherit from.
     */
    static RootClass = do {
        new ScopeTypeItem("Object", null, {})
    }
}