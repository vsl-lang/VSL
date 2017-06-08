import TransformationContext from './transformationContext';
import Transformation from './transformation';
import ScopeTraverser from './scopetraverser';
import Node from '../parser/nodes/node';
import ASTTool from './asttool';
import t from '../parser/nodes';

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
 * 
 * ### Scoping
 * Handles scoping. This resolves identifiers to an extent. To locate an item
 * a search will take a non-constant time complexity but declarations can be
 * used in terms of indexing. If an \\(O(1 + \lg{n})\\) does not resolve our item then
 * we will check if:
 * 
 * 
 * $$\exists n\in S :n \geq (V : n)$$
 * 
 * Where `S` is the dynamic processed scope \\( (S\_n)\_{n\in V} \\) and `V` represents
 * the relative position in a pre-generated scope. In this case we'd specify
 * a resolution to the value. If:
 * 
 * $$\exists t \subseteq C : \forall j \in  t : t \in S_n$$
 * 
 * Where `C` is a candidate, then we will throw an error due to a cyclic
 * dependence on type resolution index.
 * 
 * ---
 * 
 * Each scope is defined by a `t.CodeBlock` node and if a `get Node#identifierPath()`
 * call does not return nil; the returned {@link Identifier} is then taken as the
 * identifier to declare a variable as.
 */
export default class Transformer extends ScopeTraverser {
    
    /**
     * Creates a new Transformer with the given passes and context. Reference
     * {@link TransformationContext} for more information on the context itself.
     * Passes can again use their AST tool to access context information.
     *
     * @param {Transformation[]} passes - The given passes to setup
     * @param {TransformationContext} [context=TransformationContext()] - The
     *     context of the given transformation see this constructor's
     *     description for more info.
     */
    constructor(passes: Transformation[], context: TransformationContext = new TransformationContext()) {
        super(true);
        
        /**
         * Contains a list of all the transformations the transformer will use.
         * 
         * @type {Transformation[]}
         */
        this.passes = passes;
        
        /** @private */
        this.time = null;
        
        /**
         * DO NOT directly modify. Use `queue` or such to modify. Exposed
         * primarially for performance and GC reasons.
         * 
         * @type {Node[]}
         */
        this.nodeQueue = [];

        /**
         * The context of the the transformer. Transformations can set or use
         * this to get global context info etc.
         *
         * @type {TransformationContext}
         */
        this.context = context;
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
        super.queue(ast);
    }
     
    /** @override */
    receivedNode(parent: Node | Node[], name: string) {
        // Add to queue
        this.appendNodeQueue(parent, name);
    }
    
    /** @override */
    finishedNode(parent: Node | Node[], name: string) {
        if (parent[name] instanceof t.CodeBlock) {
            this.scope.pop()
        }
    }
     
    /**
     * Adds item to the end node queue (reccomended).
     */
    appendNodeQueue(parent: Node | Node[], name: string | number) {
        parent[name].queueQualifier = this.nodeQueue.length;
        
        this.nodeQueue.push([ parent[name], parent, name ]);
        this.didUpdateQueue()
    }     
    
    /**
     * Handles the queue items
     * @private
     */
    didUpdateQueue() {
        var value, node, parent, item;
        while ((value = this.nodeQueue.shift()) !== (void 0)) {
            if (value === null) continue;
            [node, parent, item] = value;
            this.transform(node, parent, item);
        }
    }
    
    /**
     * Queues a given node for transformation.
     * 
     * This accepts a specific transformation which needs to be executed, and
     * also required the parent node and the current node's name. It is
     * reccomended to use ASTTool's interface
     * 
     * This is useful if your node has children which _must_ be processed before
     * the current one is.
     * 
     * @param {Node|Node[]} node - The node(s) to be processed and queued.
     * @param {Node|Node[]} parent - The parent node of the given ast
     * @param {any} name - The reference to the child relative to the parent.
     * @param {Transformation} transformation - The desired transformation to run
     */
    queueThen(node: Node, parent: parent, name: any, transformation: Transformation) {
        this.transform_once(node, parent, name, transformation);
    }
    
    /**
     * Transform the AST accordi
ng to the setup transformer. This is recursively
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
        
        for (let i = 0; i < passes.length; i++) {
            let result = this.transform_once(
                ast,
                parent,
                name,
                passes[i]
            );
            
            if (result === false) {
                // Requeue with remaining transformations. Excluding current
                let queuedTransforms = passes.slice(i + 1);
                if (queuedTransforms.length > 0)
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
        let astTool = new ASTTool(parent, name, this);

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
