import Traverser from './traverser';
import t from '../parser/nodes';

/**
 * A traverser which pre-populates a hosited scope pass through node processing.
 * The \\((V\_n)_{n\in V'}\\) in a static scope-lookup senario. This will create
 * "intermediate scopes" \\(\left\\{v \subseteq V : \left|v\right| < n\right\\}\\)
 * which will generally be defined as \\(I\\).
 *
 * This means that while \\(I \subseteq V\\), you can always assume:
 *
 * $$\exists i \in I : (V : I_i) \equiv i$$
 *
 * This means that if:
 *
 * $$I_{n \in V \setminus I} \perp V$$
 *
 * You know something funky is going on. In terms of cyclic dependence, this
 * would update a reference when \\(V_{n \in V \setminus I}\\) is accessed. So
 * such dependencies can be resolved.
 *
 * $$  \neg(\Gamma\_{i \in (V \setminus I)} \wedge \Gamma\_{ i\perp \left\\{j \in I \right\\}} \rightarrow \Delta\_{(V \setminus I)\perp I}), \Gamma_{I\_j \perp \left\\{k \in \left(V \setminus I\right) \right\\}}\vdash P\_E(i),\Delta $$
 *
 * Where \\(P_E\\) defines such a dependency.
 */
export default class ScopeTraverser extends Traverser {
    
    /**
     * Instantiates a traverser object. Note: This must be subclassed to be
     * used. See {@link Transformer} or {@link ASTGarbageCollector} for more
     * information.
     *
     * @param {boolean} shouldProcess - Whether or not the node should be setup
     *     with special data. (Note: if false, only assume the raw node will be
     *     passed.)
     */
    constructor(shouldProcess: boolean = true) {
        super(shouldProcess);
        
        /**
         * This is basically a stack of the current scope.
         * For a normal app this would look roughy like:
         * [ STL, Libraries, Global ]
         * specify STL to provide the base STL info
         *
         * @type {CodeBlock[]}
         */
        this.scope = [];
    }
    
    /**
     * Handles updating and application of scope
     *
     * @param {Node | Node[]} parent - The parent node of the given node being
     *     processed
     * @param {string} name - The name of the current node being processed
     * @override
     */
    processNode(parent: Node | Node[], name: string) {
        let node = parent[name];
        
        // Ignore empty nodes
        if (node === null) return;
        
        // If the parent is a code block, we want to add it to the scope
        // This builds a stack of the scope tree, so for a typical top-level
        // class this might look like:
        //     libvsl, MyClass.vsl, MyClass
        // Each file would have it's own top-level preqeued block.
        if (node instanceof t.CodeBlock) {
            
            // If there is a parent scope, specify it
            if (this.scope.length > 0) {
                node.scope.parentScope = this.scope[this.scope.length - 1].scope;
            }
            
            this.scope.push(node);
        }
        
        // Store the current scope for brevity
        const currentScope = this.scope[this.scope.length - 1];
        
        // Set parent scope for transformers
        node.parentScope = currentScope || null;
        
        super.processNode(parent, name);
    }
}
