import Node from '../parser/nodes/node';

/**
 * Traverses the AST. The backbone of transformers and other times. If you ever
 * need to climb the AST of unknown types, use this. Do note that if you're
 * dealing with a transformation, that does already have a `Transformer` (which
 * is a subclass of this), so you might not need a subclass of this.
 *
 * Subclassing is easy, check the API, but the most likely method you want to
 * override is `receivedNode` which gets the parent, and name, you can get the
 * node then using `parent[name]`. Both values are passed as if the node is
 * changed you can still obtain a reference to it. Again, it's reccomended to
 * try to use `ASTTool` and modify your transformations before creating a
 * traverser objects as the queue generation is blocking and GC iterations can
 * be slow as they need to iterate yet again.
 *
 * @abstract
 */
export default class Traverser {

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
        /** @private */
        this.shouldProcess = shouldProcess;
    }

    /**
     * Queues an AST to be traversed, this in turn calls the abstract function
     * `#receivedNode(parent:name:)` which can be used to determine what to do
     * with the node. The AST is recursed in order.
     *
     * This method runs top-down in a deterministic order and is not specifically
     * run async. If it is, you can safely assume that the order of execution
     * will be the same and for every `#processsedNode` there will be an equiv.
     * `#finishedNode` call.
     *
     * This method handles strings and arrays but behavior can be overloaded to
     * add the ability to handle nodes of a non-conforming type to `Node` or a
     * `Node[]`. An example of such would be:
     *
     *     /** @override *\/
     *     queue(nodes: any) {
     *         if (ast instanceof MyClass) handle(ast);
     *         else super.queue(ast);
     *     }
     *
     * @param {any} ast - This **must** either be an array of nodes to queue
     *                    or the element whose _children_ you want to traverse.
     *                    If you pass a node itself, it itself won't be visited,
     *                    only its children.
     */
    queue(ast: any) {
        // Recursively add all AST nodes in an array
        if (ast instanceof Array) {
            let lastLength = ast.length;
            for (let i = 0; i < ast.length; i++) {
                // If it's a node array. Then we also want to queue itself and queue
                // the node itself so its children will be added.
                this.processNode(ast, i);

                // Array has gotten smaller
                if (ast.length < lastLength) {
                    lastLength = ast.length;
                    i--;
                } else {
                    // Requeue the further children
                    this.queue(ast[i]);
                }

                // Notify that the node is finished if defined
                this.finishedNode(ast, i);
            }
        } else if (ast instanceof Node) {
            let children = ast.children, name, child;

            if (children) {
                for (let i = 0; i < children.length; i++) {
                    name = children[i];

                    this.processNode(ast, name);

                    child = ast[ name ];

                    if (child != null) {
                        this.queue(child);
                    }

                    this.finishedNode(ast, name);
                }
            }
        } else {
            throw new TypeError(`Unexpected AST node: ${ast} of type ${ast.constructor.name}`);
        }
    }

    /**
     * Override this method if you'd like to process each node that comes
     * through. Don't forget to call `super.processNode`! You don't have to but
     * you probably want to.
     *
     * @param {Node | Node[]} parent - The parent node of the given node being
     *     processed
     * @param {string} name - The name of the current node being processed
     * @protected
     */
    processNode(parent: any, name: string) {
        let node = parent[name];

        if (this.shouldProcess) {
            if (node) {
                node.parentNode = parent;
                node.relativeName = name;
            }
        }

        if (node instanceof Node) this.receivedNode(parent, name);
    }

    /**
     * Called everytime the traverser encounters a node
     *
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     *
     * @abstract
     */
    receivedNode(parent: Node | Node[], name: string) {
        throw new TypeError(`${this.constructor.name}: Did not implement required method #receivedNode(parent:name:)`);
    }


    /**
     * _Optional_ method which is called once the traverser finishes processing
     * a node's children
     *
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     *
     * @abstract
     */
    finishedNode(parent: Node | Node[], name: string) {
        return;
    }
}
