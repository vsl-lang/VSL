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
    constructor (identifier: string, position: Object) {
        super(position);
        
        /** @type {ScopeItem} */
        this.identifier = new Id(identifier, null);
        
        /** @type {string} */
        this.original = identifier;
    }
    
    /** @override */
    get children() {
        return [];
    }
    
    /** @override */
    toString() {
        return this.identifier.rootId;
    }

    /** @override */
    toAst() {
        return `\u001B[1mIdentifier\u001B[0m ${this.identifier.rootId}\n`;
    }
}
