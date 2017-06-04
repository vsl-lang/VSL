import Node from './node';

/**
 * Matches an argument inside a FunctionCall
 * 
 * @example
 * argument
 * name: argument
 */

export default class ArgumentCall extends Node {
    /**
     * Creates a argument
     * 
     * @param {Expression} value - the argument value
     * @param {?Identifier} name - the name of the argument
     * @param {Object} position a position from nearley
     */
    constructor (value: Expression, name: Identifier, position: Object) {
        super(position);

        /** @type {Expression} */
        this.value = value;
        
        /** @type {?Identifier} */
        this.name = name ? name[0] : name;
    }
    
    /** @override */
    get children () {
        return ['value'];
    }
    
    /** @override */
    toString() {
        return this.name ? `${this.name}: ${this.value}` : `${this.value}`;
    }
}