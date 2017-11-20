import Node from './node';

/**
 * Matches a decorator/annotation, an array of these is kept inside a class or
 * whatever node it is applied too.
 *
 * @example
 * @foo(bar)
 *
 * @example
 * foo(bar)
 */

export default class Annotation extends Node {
    /**
     * Creates an annotation
     *
     * @param {string} name - name of the annotation
     * @param {?Node[]} args - The arguments (if exist) of it.
     * @param {Object} position - A position from nearley
     */
    constructor(name: string, args: Node[], position: Object) {
        super(position);

        /** @type {string} */
        this.name = name;

        /** @type {?Node[]} */
        this.args = args || null;
    }

    /** @override */
    get children() {
        return null;
    }
    
    clone() {
        return new Annotation(this.name, this.args?.map(arg => arg.clone()));
    }
    
    /** @override */
    toString() {
        return `@${this.name}${this.args === null ? "" : `(${this.args.join(", ")})`}`;
    }
}
