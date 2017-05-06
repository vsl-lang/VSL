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
                this.processNode(ast, i);
                
                // Requeue the further children
                this.queue(ast[i], ast);
            }
         } else if (ast instanceof Node) {
             let children = ast.children, name, child;
             
             if (children) {
                for (let i = 0; i < children.length; i++) {
                    name = children[i]
                    child = ast[ name ];
                    
                    this.processNode(ast, name);
                    
                    if (child != null) this.queue(child, ast);
                }
             }
         } else {
             if (process.env["VSL_ENV"] != "dev_debug") console.log(ast);
             throw new TypeError(`Unexpected AST node: ${ast} of type ${ast.constructor.name}`);
         }
    }
    
    /**
     * @private
     */
    processNode(parent: any, name: string) {
        
        if (process.env.VSL_ENV === "dev_debug") {
            console.log("-- Received Node --");
            console.log("Parent: ", parent);
            console.log("Name: ", name);
            console.log("Node: ", parent[name]);
            console.log("Scope: ", this.scope);
            console.log("\n\n");
        }
        
        let node = parent[name];
        if (node) node.parentNode = parent;
        
        if (node instanceof Node) this.receivedNode(parent, name);
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