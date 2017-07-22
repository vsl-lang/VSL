import CompilationStream from '../../../../index/CompilationStream';
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
     * Creates a new backend with 'watcher's for each node
     *
     * @param  {CompilationStream} stream Handled compilation where all output
     *                                    will be. Just append to a giant string
     *                                    as the IR will not be finished until
     *                                    a while so be patient.
     * @param  {BackendWatcher[]} watchers There should be ONE BackendWatcher
     *                                     for each node type. If there is more
     *                                     than one it will bork I mean what can
     *                                     I say.
     */
    constructor(stream, watchers) {
        let handlers = new Map();
        watchers.forEach(
            watcher =>
                handlers.set(watcher.type, new watcher().receive)
        );
        
        /** @private */
        this.stream = stream;
        
        /** @private */
        this.handlers = handlers;
    }
    
    /**
     * Run before generation begins
     * @abstract
     */
    pregen() { return }
    
    /**
     * @private
     */
    generate(name, parent) {
        let node = parent[name];
        
        let handler = this.handlers.get(node.constructor);
        if (!handler) throw new TypeError(
            `No handler for node ${node.constructor.name}`
        );
        
        let tool = new ASTTool(name, parent, null);
        handler(
            node,
            this,
            tool,
            (name, parent) => {
                generate(name, parent);
            }
        );
    }
    
    /**
     * Run after generation finishes
     * @abstract
     */
    postgen() { return }
    
    /**
     * Runs a list of ASTs through this backend. MAKE SURE you have ran through
     * `transform` and all types and such are available. Provide the output
     * stream here.
     *
     * Do NOT provide a global AST, please provide file-specific ASTs otherwise
     * expect wack generation.
     *
     * @param  {CodeBlock[]} inputs All the input files, see description for
     *                              more info on what specific format this
     *                              should be.
     * @param {CompilationStream} stream Stream which compilation will be
     *                                   outputted to. Wait until all stuff is
     *                                   done before using the output.
     */
    run(inputs, stream) {
        this.stream = stream;
        pregen();
        
        for (let i = 0; i < inputs.length; i++) {
            generate(i, inputs);
        }
        
        postgen();
    }
}
