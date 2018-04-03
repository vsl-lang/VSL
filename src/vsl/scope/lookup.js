/**
 * Scope lookup and resolution is pretty complex so this class exists to
 * encapsulate that. All you need to specify is your current node and your
 * target node, aka \\(I_i\\) and \\(\V_k\\) respectively.
 * 
 * I reccomend referencing {@link ScopeTraverser} for the logical demonstration
 * of how this works, {@link TypeResolver} for the reasons we have such a
 * complex scope system, and {@link Transformer} on how transformations relate
 * with scope.
 */
export default class Lookup {
    /**
     * Creates a new lookup instance which is used to resolve identifiers. Make
     * sure to only use this once per root identifier
     * 
     * @param {Node | Node[]} parent - The parent of the node to start the
     *     search from (the referencing node, try to reference scope if possible)
     * @param {string | number} name - The name of the node relative to `parent`
     */
    constructor(parent: Node | Node[], name: string | number) {
        /** @private */
        this.parent = parent;
        
        /** @private */
        this.name = name;
    }
    
    /**
     * Locates and resolves a `ScopeItem` reference.
     * 
     * @param {ScopeItem} item - the item to lookup and resolve a reference to.
     * 
     * @throws {CyclicConcurrentResolutionDependencyError} if a scope has a
     *     circular reference which depends on cyclic and concurrent resolution.
     * @return {?ScopeItem} the resolved and matching scope item, or null of not
     *     located.
     */
    lookup(item: ScopeItem): ?ScopeItem {
        // Check if requested item is in dep stack
        
        
        let node = this.parent[this.name];
        // Obtain the parent scope itself which we can use for dynamic generated
        // scope lookups, i.e. for `I_n`
        let parentScope = node.parentScope.scope;
        
        // Step 1. Obtain candidate for the ScopeItem
        let candidate = parentScope.get(item);
        return candidate;
    }
}
