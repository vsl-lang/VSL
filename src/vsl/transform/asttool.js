/**
 * Passed to Transformations to aid in traversing and modifying the AST
 * 
 * This should really only be generated by a Transformer unless you know what
 * you're doing.
 * 
 * This offers a range of functions to help in modifying an AST fragment. This
 * is offered to all transformations by a `Transformer` object and will provide
 * primarially the modification ability along with other common tasks. This
 * serves as an interface between the AST and a transformation.
 * 
 * This provides the necessary abstraction needed in order to prevent accidental
 * mutations and verify that the AST is indeed being properly traversed.
 */
export default class ASTTool {
    /**
     * Creates an ASTTool based on a fragment
     * 
     * If you aren't working with `Transformer` itself, you can ignore this and
     *  just read the function docs.
     * 
     * @param {Node|Node[]} parent - The parent node or array
     * @param {name} - The key `fragment` represents within it's parent. If the
     *     `parent` is an array, then this should be a referencing integer.
     * 
     * @private
     */
    constructor(parent: Node | Node[], name: any, transformer: Transformer) {
        /** @private */
        this.parent = parent;
        
        /** @private */
        this.name = name;
        
        /** @private */
        this.fragment = parent[name];
        
        /** @private */
        this.transformer = transformer;

        /** @private */
        this.replacement = null;
    }
    
    /**
     * Access the nth parent. This traverses up the AST tree and if the parent
     * could not be found, or another error occurs, this returns nil.
     */
    nthParent(n: number) {
        n = n | 0;
        let parent = this.parent[this.name];
        while (n > 0 && (parent = parent.parentNode)) n--;
        return parent;
    }
    
    /**
     * Recursively looks and traverses the AST to locate the value associated
     * for a given `id`.
     * 
     * @return {?(Id | Type)}
     */
    resolve(id: string) {
        let scope = this.parent[this.name].parentScope, res;
        while (scope && !(res = scope.scope.get(string))) scope = scope.parentScope;
        return res || null;
    }
    
    /**
     * Transforms a node and then calls the callback when the transformation is
     * finished executing. See {@link Transformer}'s `queueThen` for more
     * information on what this does.
     * 
     * Note: `node` MUST BE a DIRECT child of the current node. If it is not,
     * use `.queueThenDeep`.
     * 
     * This is merely a wrapper which makes execution simpler.
     * 
     * @param {Node|Node[]} node - The node(s) to be processed and queued.
     * @param {?Transformation} transformation - The desired transformation to run
     * @param {func()} callback - Called when the node is processed
     */
    queueThen(node: node, transformation: ?Transformation) {
        this.queueThenDeep(node, this.parent, this.name, transformation);
    }
    
    /**
     * Transforms a node and then calls the callback when the transformation is
     * finished executing. See {@link Transformer}'s `queueThen` for more
     * information on what this does.
     * 
     * This offers the ability to queue another but a direct child.
     * 
     * Alternatively, if `tranformation` is null, this will run all
     * transformations.
     * 
     * @param {Node|Node[]} node - The node(s) to be processed and queued.
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     * @param {?Transformation} transformation - The desired transformation to run
     * @param {func()} callback - Called when the node is processed
     */
    queueThenDeep(node: Node, parent: parent, name: any, transformation: ?Transformation) {
        if (transformation === null) {
            this.transformer.transform(node, parent, name);
        } else {
            this.transformer.queueThen(node, parent, name, transformation);
        }
    }

    
    /**
     * Replaces the fragment with a new node.
     * 
     * ### Overview
     * Use this method to replace the given node.
     * 
     * ### Notes
     * Ensure that the resulting node is of a correct type as no checks are done
     * as of this time.
     * 
     * @param {Node} withNode - the replacement node
     */
    replace(withNode: Node) {
        withNode.parentScope = this.parent[this.name].parentScope;
        withNode.parentNode = this.parent;
        this.parent[this.name] = withNode;
    }
    
    /**
     * Removed a fragment from tree. This does not remove the reference form the
     * parent tree. 
     * 
     * NOTE: This invalidates the AST tool, it cannot be used anymore for
     * functions which reference the exising node. Node's are tracked by their
     * parent and position so further `replace` calls may work but will not be
     * applicable for garbage colleciton by this method.
     * 
     * It should almost always be used after a `.replace` call or other calls
     * which remove a node. If you do use a `.replace`, you'd usually want this
     * as the last statement in your transformer.
     */
    gc() {
        
    }
    
    /**
     * Notifies the scope that an identifier has been changed. This will
     * automatically determine the changed node and will check with the fragment
     * to determine what is the best way and if even at all the scope needs to
     * be updated.
     */
    notifyScopeChange() {
        // TODO: Unimplemented
    }
}