import LLVMBackend from '../vsl/backend/llvm';
import EmissionInstance from './EmissionInstances';

/**
 * This represents the execution of a VSL program.  To obtain an execution index
 * use the execute
 */
export default class CompilationInstance {
    /**
     * @private
     */
    constructor(module, index) {
        /**
         * The execution as a module if applicable.
         * @type {?Module}
         */
        this.module = module;

        /**
         * The index representing the entire compilation.
         * @type {CompilationIndex}
         */
        this.index = index;

        /**
         * This is the backend which can be used to configure its options.
         */
        this.backend = new LLVMBackend();

        /** @private */
        this._isCompiled = false;
    }

    /**
     * Returns if the instance has been compiled through the backend yet.
     * @type {bool}
     */
    get isCompiled() {
        return this._isCompiled;
    }

    /**
     * This **compiles** to bytecode the instance. Does not recompile if already
     * compiled.
     * @returns {EmissionInstance}
     * @throws {TypeError} if already compiled.
     * @async
     */
    async compile() {
        if (this.isCompiled) {
            throw new TypeError('Attempted to compile already compiled instance.');
        }

        this.backend.run(this.index.root.globalScope.statements);

        this._isCompiled = true;

        return new EmissionInstance(this.backend);
    }
}
