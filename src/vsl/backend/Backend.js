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
     * Generic backend with output stream
     * @param {CompilationStream} stream
     */
    constructor(stream) {
        /**
         * Stream to write to.
         * @type {CompilationStream}
         */
        this.stream = stream;
    }

    /**
     * Writes to output
     * @param {string} data - Data to write as a UTF8 string
     */
    write(data) {
        this.stream.send(data);
    }

    /**
     * Returns the watchers for this backend to subclass use
     * `yield* super.watchers()` to inherit parent.
     * @return {BackendWatcher} watchers in order to try.
     */
    *watchers() {}

    /**
     * Run before generation begins
     * @param {Object} context
     * @abstract
     * @protected
     */
    pregen() { return }

    /**
     * Generates a node.
     * @param {string | number} name - node name
     * @param {Node | array} parent - parent node
     * @param {Object} context - any context
     * @return {Object} any object as returned by recieve
     * @throws {TypeError} thrown if no handler for a given node
     * @protected
     */
    generate(name, parent, context) {
        let node = parent[name];

        for (let watcher of this.watchers()) {
            if (watcher.match(parent[name])) {
                let tool = new ASTTool(parent, name, null);

                return watcher.receive(
                    node,
                    tool,
                    ::this.generate,
                    context
                );
            }
        }

        // If here, no watcher run.
        throw new TypeError(
            `No handler for node ${node.constructor.name}`
        );
    }

    /**
     * Emits a warning regarding a node
     * @param {BackendWarning} warning - emitted warning.
     */
    warn(warning) {
        this.stream.emitWarning(warning);
    }

    /**
     * @type {BackendWarning[]}
     */
    get warnings() { return this._warnings; }

    /**
     * Run after generation finishes
     * @param {Object} context
     * @abstract
     * @protected
     */
    postgen() { return }

    /**
     * Creates initial context object
     * @param {TransformationContext} transformationContext
     * @return {Object} anything
     * @protected
     * @abstract
     */
    createInitialContext(transformationContext) {}

    /**
     * Runs a list of ASTs through this backend. MAKE SURE you have ran through
     * `transform` and all types and such are available. Provide the output
     * stream here.
     *
     * Do NOT provide a global AST, please provide file-specific ASTs otherwise
     * expect wack generation.
     *
     * @param {CodeBlock[]} input Code-block to start as 'entry' point.
     * @param {TransformationContext} transformationContext
     */
    run(inputs, transformationContext) {
        this.pregen();

        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < inputs[i].statements.length; j++) {
                const initialCtx = this.createInitialContext(transformationContext);
                this.generate(j, inputs[i].statements, initialCtx);
            }
        }

        const postgenContext = this.createInitialContext(transformationContext);
        this.postgen(postgenContext);
    }
}
