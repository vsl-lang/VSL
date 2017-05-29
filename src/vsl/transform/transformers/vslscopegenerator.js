import ScopeTraverser from '../scopetraverser';

/**
 * This will generate a static scope object, defined as \\(V\\) for the static,
 * global scope which can be used to define mutually recursive and encountered
 * items along with forward declarations. I reccomend seeing the details of
 * {@link ScopeTraverser} for more information on how it works. This merely
 * obtains those details and performs a primary pass of scope before type
 * deduction occurs.
 */
export default class VSLScopeGenerator extends ScopeTraverser {
    /**
     * Creates a default scope generator
     * @overload
     */
    constructor() {
        super(false); // We could give less craps about this stuff.
    }
    
    /**
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     * 
     * @override
     */
    receivedNode(parent: Node | Node[], name: string | number) {
        let node = parent[name];
        
        
    }
}