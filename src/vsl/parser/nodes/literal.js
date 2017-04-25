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
     * @param {String} literal the literal string value of the literal
     * @param {Object} position a position from nearley
     */
    constructor(literal: string, position: Object) {
        super(position);
        this.literal = literal;
    }
}