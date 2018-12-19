import ScopeTraverser from './scopetraverser';
import t from '../parser/nodes';

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
     * @param {name} name - The key `fragment` represents within it's parent. If
     *     the `parent` is an array, then this should be a referencing integer.
     * @param {?Transformer} transformer - if called by a transformer, ref it
     *     here.
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

        /** @private */
        this.sourceQualifier = this.fragment.queueQualifier;

        /**
         * The context which created this ASTTool, non-nil for items such
         *
         * @type {?TransformationContext}
         */
        this.context = (this.transformer && this.transformer.context) || null;
    }

    /**
     * Returns the NEAREST CODEBLOCK'S scope the node is in
     * @type {?Scope}
     */
    get scope() {
        return this.fragment?.parentScope?.scope;
    }

    /**
     * Returns the static scope of encapsulating declaration if exists
     * @type {?Scope}
     */
    get staticScope() {
        return this.declarationNode?.reference?.staticScope;
    }

    /**
     * Get scope that assignment should happen in
     * @type {?Scope}
     */
    get assignmentScope() {
        const declNode = this.declarationNode;
        if (declNode) {
            if (this.isStatic) {
                return this.staticScope;
            } else {
                return declNode.reference.subscope || this.scope;
            }
        } else {
            return this.scope;
        }
    }

    /**
     * Determines if a declaration of some sorts is static.
     * @type {Boolean}
     */
    get isStatic() {
        return this.fragment.access.includes('static');
    }

    /**
     * Gets the parent declaration for a declaration. I.e. if this is a method,
     * field, etc. this will give the class/itf/etc. node.
     * @type {DeclarationStatement}
     */
    get declarationNode() {
        const parentNode = this.fragment.parentScope?.parentNode;
        return parentNode instanceof t.DeclarationStatement ? parentNode : null;
    }

    /**
     * Determines is a declaration is explicitly declared private
     * @type {Boolean}
     */
    get isPrivate() {
        return this.fragment.access.includes('private');
    }

    /**
     * Access the nth parent. This traverses up the AST tree and if the parent
     * could not be found, or another error occurs, this returns nil. Passing 0
     * will return the node itself.
     *
     * @param {number} n - A positive number representing the index to access.
     */
    nthParent(n: number) {
        n = n | 0;
        let parent = this.parent[this.name];
        while (n > 0 && (parent = parent.parentNode)) n--;
        return parent;
    }

//     /**
//      * Recursively looks and traverses the AST to locate the value associated
//      * for a given `id`.
//      *
//      * @return {?(Id | Type)}
//      */
//     resolve(id: string) {
//         let scope = this.parent[this.name].parentScope, res;
//         while (scope && !(res = scope.scope.get(string))) scope = scope.parentScope;
//         return res || null;
//     }

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
     * @param {string} name - name of the field of the node(s) to be processed.
     * @param {?Transformation} transformation - The desired transformation to run
     */
    queueThen(name, transformation) {
        const node = this.parent[this.name];
        this.queueThenDeep(node[name], node, name, transformation);
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
     */
    queueThenDeep(node: Node, parent: parent, name: any, transformation: ?Transformation = null) {
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
        this.parent[this.name] = withNode;
        const scopeTraverser = new ScopeTraverser();
        scopeTraverser.scope.push(this.fragment.parentScope);
        scopeTraverser.processNode(this.parent, this.name);
        scopeTraverser.queue(this.parent[this.name]);
    }

    /**
     * Removes a node from the parent.
     *
     * ### Overview
     * This method will remove the node from the parent by checking what sort of
     * parent it has. If the parent node is an array it will be .splice'd out
     * (i.e. removed) from the array. Otherwise the element will be set to null
     *
     * ### Notes
     * Ensure that removing the node wouldn't significantly break the AST, in
     * some cases a node-list shouldn't be empty.
     */
    remove() {
        if (this.parent instanceof Array) {
            this.parent.splice(this.name, 1);
        } else {
            this.parent[this.name] = null;
        }
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
     *
     * @param {number} [relativeQueueQualifier=this.sourceQualifier] - The
     *     queue qualifier of the node.
     */
    gc(relativeQueueQualifier: number = this.sourceQualifier) {
        if (relativeQueueQualifier === null) return;
        if (this.transformer === null) return;

        // TODO: implement
        // this.transformer.nodeQueue.splice(relativeQueueQualifier, 1);
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
