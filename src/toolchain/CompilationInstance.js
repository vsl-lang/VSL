import LLVMBackend from '../vsl/backend/llvm';
import EmissionInstance from './EmissionInstance';
import CompilationStream from '../index/CompilationStream';

/**
 * This represents the execution of a VSL program.  To obtain an execution index
 * use the execute
 */
export default class CompilationInstance {
    /**
     * @private
     */
    constructor(module, index, triple) {
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

        /** @private */
        this.stream = new CompilationStream();

        /**
         * This is the backend which can be used to configure its options.
         * @type {LLVMBackend}
         */
        this.backend = new LLVMBackend(this.stream, triple);

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
     * @param {Object} [options={}] - Compilation options
     * @param {func(warning: BackendWarning): void} options.emitWarning - A
     *                  callback passed with a warning object.
     * @returns {EmissionInstance}
     * @throws {TypeError} if already compiled.
     * @async
     */
    async compile({ emitWarning } = {}) {
        if (this.isCompiled) {
            throw new TypeError('Attempted to compile already compiled instance.');
        }

        if (emitWarning) {
            this.stream.registerWarningListener(emitWarning);
        }

        this.backend.run(this.index.root.globalScope.statements);

        this._isCompiled = true;

        return new EmissionInstance(this.backend);
    }
}
