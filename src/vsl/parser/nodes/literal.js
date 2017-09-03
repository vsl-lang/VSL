import Node from './node';

/**
 * This matches any simple literal.
 * 
 * This excludes more complex literal types such as lambdas and switches.
 * If it can be expressed in a single string this class will wrap it, else
 *  consider a more complex class. 
 * 
 * The primary classes using this are:
 *  - String
 *  - Number
 *  - Boolean?
 */
export default class Literal extends Node {
    
    /**
     * Creates a wrapper for literals
     * 
     * @param {string} literal the literal string value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (literal: string, type: number, position: Object) {
        super(position);
        
        /** @type {string} */
        this.literal = literal;
        
        /** @type {VSLTokenType} */
        this.type = type;

        /** @type {ScopeItem[]} */
        this.typeCandidates = [];
    }
    
    /** @override */
    get children() {
        return [];
    }
    
    /** @override */
    toString() {
        return this.literal;
    }

    /** @override */
    toAst() {
        return `\u001B[1mLiteral\u001B[0m ${this.type === 2 ? JSON.stringify(this.literal) : this.literal}\n`;
    }
}
