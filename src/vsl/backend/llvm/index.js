import Backend from '../Backend';
import * as w from './watchers';

import LLVMContext from './LLVMContext';

import * as llvm from "llvm-node";


/**
 * LLVM backend which directly compiles to LLVM bytecode.
 */
export default class LLVMBackend extends Backend {
    /**
     * Creates llvm backend with given output stream/output location
     * @param {CompilationStream} stream
     */
    constructor(stream) {
        super(stream, 'llvm');

        /** @type {llvm.Context} */
        this.context = new llvm.LLVMContext();

        /** @type {llvm.Module} */
        this.module = new llvm.Module('main', this.context);
    }

    /**
     * @override
     */
    *watchers() {
        yield* super.watchers();

        // Sort in order of likely occurence
        yield new w.NoOp();
        yield new w.RootFunction();
        yield new w.ExpressionStatement();
        yield new w.Literal();
        yield new w.FunctionCall();
    }

    /**
     * Writes bitcode to file
     * @param {string} file Output file
     */
    writeBitCodeTo(file) {
        llvm.writeBitcodeToFile(this.module, file);
    }

    /**
     * Returns bytecode
     * @param {string} dump - Dump of byte code as string.
     */
    getByteCode() {
        return this.module.print();
    }

    /**
     * Begins generation.
     * @param {CodeBlock} input
     * @abstract
     */
    start(input) {
        for (let i = 0; i < input.statements.length; i++) {
            this.generate(i, input.statements, new LLVMContext(
                this
            ));
        }
    }
}
