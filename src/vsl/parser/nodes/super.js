import Node from './node';

/**
* Refers to `super` in context
*/
export default class Super extends Node {

    /**
    * Creates a super node
    *
    * @param {Object} position a position from nearley
    */
    constructor(position: Object) {
        super(position);

        /** @type {?ScopeTypeItem} */
        this.reference = null;
    }

    clone() {
        return new Super();
    }

    /** @override */
    get children() {
        return [];
    }

    /** @override */
    toString() {
        return `super`;
    }

    /** @override */
    toAst() {
        return `\u001B[1msuper\u001B[0m\n`;
    }
}
