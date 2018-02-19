import Backend from '../Backend';
import * as w from './watchers';

import LLVMContext from './LLVMContext';

import * as llvm from "llvm-node";


/**
 * ## JavaScript
 * This is the JavaScript backend for VSL. It outputs (usually user-friendly)
 * ES6 JavaScript code which can be run.
 *
 * ### Entry
 * This provides the following entry points:
 *
 *  - **Start**: Run on program start. Compiles differently based on target.
 *    - `public func main() -> Void` run on start (IIFE)
 *    - `public func main(args: String[]) -> Void` run on start (node.js)
 *  - **Onload**: For browser runs on specific actions
 *    - `public func ready(document: Document, event: Event) -> Void` runs when
 *       the DOM has loaded.
 *    - `public func onload(document: Document, event: Event) -> Void` runs when
 *       the document has loaded.
 *    - `public func onload(window: Window, event: Event) -> Void` runs when the
 *       document window has loaded.
 *
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

    pregen() {
    }

    /**
     * @override
     */
    *watchers() {
        yield* super.watchers();
        yield new w.NoOp();
        yield new w.RootFunction();
        yield new w.ExpressionStatement();
        yield new w.FunctionCall();
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

    postgen() {
        this.write(this.module.print());
    }
}
