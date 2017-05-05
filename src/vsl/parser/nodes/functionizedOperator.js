import Node from './node';

/**
 * Represents a functional operator
 * 
 * A functional operator is a shorthand for creating a lambda with a single op.
 * 
 * This node represents a functional operator and is created by specifiying the
 * operator type which must be part of the tokenizer and align with a specified
 * operator type. The type the functionalized operator is not needed as is
 * transformed into a lambda recursively and that can be type inferred.
 * 
 * @example
 * (==)
 */
 
export default class FunctionizedOperator extends Node {
    
    /**
     * Creates a FunctionizedOperator node
     * 
     * @param {Operator} operator the opreator to functionize
     * @param {Object} position a position from nearley
     */
    constructor (operator: any, position: Object) {
        super(position);
        
        /** @type {string} */
        this.operator = operator;
    }
}