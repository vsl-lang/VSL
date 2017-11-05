import BackendStream from './BackendStream';
import Traverser from '../transform/traverser';
import ASTTool from '../transform/asttool';

/**
 * Any backend needs to implement and subclass this abstract class and implement
 * the approriate methods. This is like a transformer but implements output
 * streams and requires methods to have generation definitions (on-demand). This
 * itself is not very configurable but backends (e.g. {@link VSLLLIR}) generally
 * have a lot of options.
 *
 * @abstract
 */
export default class Backend {
    /**
     * Returns the watchers for this backend to subclass use
     * `yield* super.watchers()` to inherit parent.
     * @return {BackendWatcher} watchers in order to try.
     */
    *watchers() {}
    
    /**
     * Run before generation begins
     * @abstract
     */
    pregen() { return }
    
    /**
     * Generates a node.
     * @param {string | number} name - node name
     * @param {Node | array} parent - parent node
     * @param {Object} context - any context
     * @protected
     */
    generate(name, parent, context) {
        let node = parent[name];
        
        let didRun = false;
        for (let watcher of this.watchers()) {
            if (watcher.match(parent[name])) {
                let tool = new ASTTool(parent, name, null);
                
                watcher.receive(
                    node,
                    tool,
                    ::this.generate,
                    context
                );
                
                didRun = true;
            }
        }
        
        if (didRun === false) {
            throw new TypeError(
                `No handler for node ${node.constructor.name}`
            );
        }
    }
    
    /**
     * Run after generation finishes
     * @abstract
     */
    postgen() { return }
    
    /**
     * Begins generation.
     * @param {CodeBlock} input
     * @abstract
     */
    start(input) {}
    
    /**
     * Runs a list of ASTs through this backend. MAKE SURE you have ran through
     * `transform` and all types and such are available. Provide the output
     * stream here.
     *
     * Do NOT provide a global AST, please provide file-specific ASTs otherwise
     * expect wack generation.
     *
     * @param  {CodeBlock[]} input Code-block to start as 'entry' point.
     * @param {BackendStream} stream Stream which compilation will be outputted
     *                               to. Wait until all stuff is done before
     *                               using the output.
     */
    run(inputs, stream) {
        this.stream = stream;
        this.pregen();
        
        for (let i = 0; i < inputs.length; i++) {
            this.start(inputs[i]);
        }
        
        this.postgen();
    }
}
