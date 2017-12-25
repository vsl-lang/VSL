import Backend from '../Backend';
import * as w from './watchers';

/**
 * ## JavaScript
 * This is the JavaScript backend for VSL. It outputs (usually user-friendly)
 * ES6 JavaScript code which can be run.
 *
 * ### Entry
 * This provides the following entry points:
 *
 *  - **Start**: Run on program start. Compiles differently based on target.
 *    - `public func main() -> Void` run on start
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
    constructor(stream) {
        super('js');

    }

    pregen() {
        this.stream.write(
            `// Compiled with the VSL JSBackend compiler.\n` +
            `// Generated: ${Date()}\n`
        );

        this.stream.write(`/*vsl:begin*/\n`);
    }

    postgen() {
        this.stream.write(
            `\n/*vsl:end*/\n`
        );
    }
}
