import Node from './node';

/**
* Refers to `self` in context
*/
export default class Self extends Node {

    /**
    * Creates a self node
    *
    * @param {Object} position a position from nearley
    */
    constructor(position: Object) {
        super(position);

        /** @type {?ScopeTypeItem} */
        this.reference = null;
    }

    clone() {
        return new Self();
    }

    /** @override */
    get children() {
        return [];
    }

    /** @override */
    toString() {
        return `self`;
    }

    /** @override */
    toAst() {
        return `\u001B[1mself\u001B[0m\n`;
    }
}
