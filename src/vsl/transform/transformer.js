import Transformation from './transformation';
import ASTTool from './asttool';
import Node from '../parser/nodes/node';

/**
 * Takes an AST and transforms it according to a series of transformations
 * 
 * This is a generic class, reference VSLTransfomer for a VSL-specific
 * implementation
 * 
 * ### Overview
 * This takes a series of "passes" which are applied to the AST, each "pass"
 *  would return a new AST node which would be replaced (if specified as so).
 * This is now excluded and further matching AST nodes would be applied
 * 
 * ### Usage
 * 
 * A `Transformer` can be subclassed (see {@link VSLTransformer}) with a no-args
 * providing this class with the applicable transformers. This class can also
 * be directly constructed with the applicable constructors with no difference.
 * A subclass of `Transformer` should not offer any significant interface not
 * specified by `Transformer` as internal structure might rapidly change.
 * 
 * Note: If you're in the REPL and want to just load everything. Just run:
 * 
 *     var VSLParser = require('./lib/vsl/parser/vslparser.js');
 *     var p = new VSLParser(); var ast = p.feed("1 + 1");
 *     var VSLTransformer = require('./lib/vsl/transform/vsltransformer');
 *     var t = new VSLTransformer();
 * 
 * Additionally, it is reccomended to use `Transformer#queue` to initially load
 * the AST.
 * 
 * ### Details
 * In practice, each AST Node is treated like a `Node**`, when a node is swapped
 * the other transformers will mutate it if applicable. This prevents infinite 
 * recursion at the end, the node will be requeued for processing, it's children
 * will be in turn verified for applicable transformations. This means a node should not rely on transformation order for any reason,
 * transformations may be parallelized and therefore should also not have any
 * side-effects and be thread safe, concurrency may or may not be implemented in
 * any specific way.
 */
export default class Transformer {
    
    /**
     * Creates a new Transformer with the given passes
     * @param {Transformation[]} passes - The given passes to setup
     */
    constructor(passes: Transformation[]) {
        /** @private */
        this.passes = passes;
        
        /** @private */
        this.time = null;
        
        /** Queue of AST nodes to parse */
        this.nodeQueue = [];
    }
    
    /**
     * Queues an AST to be parsed, calls `transform(ast:)` and automatically
     * handles transformation distribution. Therefore, this is the reccomended
     * way to automatically setup and queue the inital AST nodes.
     * 
     * It is reccomended to buffer expressions with `queue(ast:)` and use the transform
     * status to determine whether a fork of Transformers should be utilized or 
     * to simply continuing to pipe further AST statements into queue. This operation
     * may or may not be syncronous.
     * 
     * Avoid directly calling from a {@link Transformation}
     * 
     * Return value can be extracted by specifying an `.oncompletion` handler.
     * 
     * @param {any} ast - An AST as outputted by a `Parser`
     */
     queue(ast: any) {
         // Recursively add all AST nodes in an array
         if (ast instanceof Array) {
            // And of course, 0-length arrays are contentless so can be
            // ignored
            if (ast.length === 0) return;
            
            let queueUpdated = false; 
            
            for (let i = 0; i < ast.length; i++) {
                // If it's a node array. Then we also want to queue itself and queue
                // the node itself so its children will be added.
                if (ast[i] instanceof Node) {
                    queueUpdated = true;
                    this.appendNodeQueue(ast, i);
                }
                
                // Requeue the further children
                this.queue(ast[i]);
            }
            
            if (queueUpdated) this.didUpdateQueue();
         } else if (ast instanceof Node) {
             let children = ast.children, name, child;
             
             if (children) {
                for (let i = 0; i < children.length; i++) {
                    name = children[i]
                    child = ast[ name ];
                    
                    if (child instanceof Array)
                        this.queue(child);
                    else
                        this.appendNodeQueue(ast, name);
                }
             }
             
             this.didUpdateQueue();
         } else {
             throw new TypeError(`Unexpected AST node: ${ast} of type ${ast.constructor.name}`);
         }
     }
     
     /**
      * Adds item to node queue
      * @private
      */
    appendNodeQueue(parent, name) {
        this.nodeQueue.push([ parent[name], parent, name ]);
    }
     
     /**
      * Handles the queue items
      * @private
      */
    didUpdateQueue() {
        var value, node, parent, item;
        while (value = this.nodeQueue.shift()) {
            [node, parent, item] = value;
            let result = this.transform(node, parent, item);
        }
    }
    
    /**
     * Transform the AST according to the setup transformer. This is recursively
     * called and should never be called from within a transformer
     * 
     * @param {Node} ast - An AST as outputted by a `Parser`
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     * @param {Transformation[]} [passes=this.passes] - Do not specify. Only for internal use
     * @return A transformed AST with the passes applied
     * 
     * @example
     * var AST = new VSLParser().feed(new VSLTokenizer().tokenize(input));
     * var final = new VSLTransformer(VSLTransformer.default).transform(AST);
     */
    transform(ast: any, parent: parent, name: any, passes: Transformation[] = this.passes) {
        
        let t = process.hrtime();
        
        for (let i = 0; i < this.passes.length; i++) {
            let result = this.transform_once(
                ast,
                parent,
                name,
                this.passes[i]
            );
            
            if (result === true) {
                // Requeue with remaining transformations. Excluding current
                let queuedTransforms = this.passes.slice(i + 1);
                this.transform(parent[name], parent, name, queuedTransforms);
                break;
            }
        }
        
    }
    
    /**
     * Transforms with single transformer.
     * 
     * @return {bool} if node was mutated and should be requeued.
     * @private
     */
    transform_once(ast: Node, parent: Node | Node[], name: any, pass: Transformation) {
        // Create the tool for modification
        let astTool = new ASTTool(ast, parent, name);
        
        // Setup the transformation
        let transformation = new pass();
        let type = transformation.type
        
        // Ensure ast is of the correct type
        // otherwise stop processing the node
        if (!(type === null || ast instanceof type))
            return false;
        
        // Call transformation
        transformation.modify(ast, astTool);
        
        // Get new node
        let result = parent[name];
        
        return ast === result;
    }
}