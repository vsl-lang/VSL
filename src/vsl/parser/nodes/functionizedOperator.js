import Node from './node';

export default class FunctionizedOperator extends Node {
    
    /**
     * Creates a wrapper FunctionizedOperator
     * 
     * @param {Operator} operator the opreator to functionize
     * @param {Object} position a position from nearley
     */
    constructor (operator: any, position: Object) {
        super(position);
        
        /** @type {string} */
        this.operator = operator;
    }
    
    get children () {
        return [operator];
    }
}