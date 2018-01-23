import Backend from '../Backend';
import * as w from './watchers';
import * as b from './builders';

import JSContext from './JSContext';

import { generate } from 'astring';

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
export default class JSBackend extends Backend {
    /**
     * Creates JS backend with given output stream/output location
     */
    constructor() {
        super('js');

        /**
         * Root-level statements
         * @type {Array}
         */
        this.root = [];

        /**
         * Entry IIFE
         * @type {Statement[]}
         */
        this.entry = [];

        /**
         * AST of whole program
         * @type {Object}
         */
        this.ast = {
            type: "Program",
            comments: [
                b.Comment(`Compiled using VSL: Versatile Seals Laugh.`),
                b.Comment(`Compiled on ${Date()}`),
                b.Comment(`@@VSL@@~startModule:main`)
            ],
            body: this.root
        }
    }

    pregen() {
        // Write the entry IIFE
        this.root.push(
            b.Expression(
                b.Call(
                    b.Lambda({
                        name: 'main',
                        params: [
                            b.Id('args')
                        ],
                        body: b.Block(this.entry)
                    }),
                    [
                        b.Member(b.Id('process'), b.Id('argv'))
                    ]
                )
            )
        );
    }

    /**
     * Begins generation.
     * @param {CodeBlock} input
     * @abstract
     */
    start(input) {
        for (let i = 0; i < input.statements.length; i++) {
            this.generate(i, input.statements, new JSContext(
                this,
                this.entry
            ));
        }
    }

    postgen() {
        this.stream.write(generate(this.ast, {
            comments: true
        }));
    }
}
