import Node from './node';
import Id from '../../scope/scopeItem';

/**
 * Wraps a identifier.
 *
 * Identifiers are specified by the tokenizer but this serves just as a class
 *  which is used for the parser
 *
 */
export default class Identifier extends Node {

    /**
     * Creates an identifier
     *
     * @param {string} identifier the identifier
     * @param {Object} position a position from nearley
     */
    constructor(identifier: string, position: Object) {
        super(position);

        /** @type {string} */
        this.value = identifier;

        /** @type {?ScopeItem} */
        this.reference = null;
    }

    clone() {
        return new Identifier(
            this.original
        );
    }

    /** @override */
    get children() {
        return [];
    }

    /** @override */
    toString() {
        return this.value;
    }

    /** @override */
    toAst() {
        return `\u001B[1mIdentifier\u001B[0m; ${this}\n`;
    }
}
