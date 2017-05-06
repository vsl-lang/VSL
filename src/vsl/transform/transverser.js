import Node from '../parser/nodes/node';

/**
 * Transverses the AST.
 * 
 * @abstract
 */
export default class Transverser {
    
    /**
     * Queues an AST to be transversed, this in turn calls the abstract function
     * `#receivedNode(parent:name:)` which can be used to determine what to do
     * with the node. The AST is recursed in order.
     * 
     * @param {any} ast - An AST as outputted by a `Parser`
     */

    queue(ast: any) {
        // Recursively add all AST nodes in an array
         if (ast instanceof Array) {
            for (let i = 0; i < ast.length; i++) {
                // If it's a node array. Then we also want to queue itself and queue
                // the node itself so its children will be added.
                if (ast[i] instanceof Node) {
                    this.receivedNode(ast, i);
                }
                
                // Requeue the further children
                this.queue(ast[i]);
            }
         } else if (ast instanceof Node) {
             let children = ast.children, name, child;
             
             if (children) {
                for (let i = 0; i < children.length; i++) {
                    name = children[i]
                    child = ast[ name ];
                    
                    if (child instanceof Node) {
                        this.receivedNode(ast, name);
                    }
                    
                    if (child != null) this.queue(child);
                }
             }
         } else {
             if (process.env["VSL_ENV"] != "dev_debug") console.log(ast);
             throw new TypeError(`Unexpected AST node: ${ast} of type ${ast.constructor.name}`);
         }
    }
    
    /**
     * Called everytime the transverser encounters a node
     * 
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     * 
     * @abstract
     */
    receivedNode(parent: any, name: string) {
        throw new TypeError(`${this.constructor.name}: Did not implement required method #receivedNode(parent:name:)`);
    }
    
}