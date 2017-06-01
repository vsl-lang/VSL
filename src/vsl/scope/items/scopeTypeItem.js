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
     * @param {string} rootId - The root primary identifier of this type.
     * @param {Scope} subscope - All items in the class's scope
     * @param {Object} data - Information about the class
     * @param {ScopeTypeItem[]} data.castables - Types which this can safely be
     *     cast to. We'll assume that you've done all the checks because if
     *     something is wrong here expect big giant segfaults. If you have a
     *     superclass, specified it'll go both in the superclass field and here.
     * @param {ScopeTypeItem} data.superclass - The superclass (not interface)
     *     of the current class, don't specify if there is none. You don't need
     *     to resolve inheritance or anything.
     * @param {boolean} data.isInterface - Whether the type is an interface.
     *     This is used to determine how casting will occur and dynamic dispatch
     *     so ensure that it is not possible to declare fields.
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