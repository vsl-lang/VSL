/**
 * This is a simple wrapper class for a method which handles one node type. Do
 * NOT write more than one backend watcher for a node type that is stupid and
 * will break things and just don't do it unless you hate puppies.
 *
 * This has two things you need to do when subclassing:
 *
 *    - specify `static type =`'s value (set it to the node type this is
 *      handling)
 *    - specify `receive(...)` which handles IR for a node (node)
 *
 * @abstract
 */
export default class BackendWatcher {
    static type = null;
    
    /**
     * Function which handles a node and outputs IR.
     * @param {Node} node The node which is a subclass of `Self.type`
     * @param {Backend} backend The backend calling this watcher
     * @param {ASTTool} tool AST for node.
     * @param {function(name: any, parent: any)} regen callback
     *                                                                to
     *                                                                regenerate
     *                                                                a specific
     *                                                                node.
     * @abstract
     */
    receive(node, backend, tool, regen) {
        throw new TypeError("Did not override backend watcher");
    }
}
