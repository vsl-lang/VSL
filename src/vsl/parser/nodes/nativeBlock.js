import Node from './node';

/**
 * A native block is a set of code which contains native code.
 */
export default class NativeBlock extends Node {

    /**
     * Creates a native block.
     * @param {String} value - string value of the native block.
     * @param {Object} position - a position from nearley
     */
    constructor(value: String, position: Object) {
        super(position);
        this.value = value;
    }

    clone() {
        return new NativeBlock(
            this.value
        )
    }

    /** @override */
    get children() {
        return [];
    }

    toString() {
        return `native(${this.value})`;
    }
}
