import Node from './node';

/*
 * M atches a ternary.
 *
 * This matches a ternary.
 */
export default class Ternary extends Node {
    
    /**
     * Creates a wrapper ExperssionStatement
     *
     * @param {Expression} condition condition
     * @param {Expression} ifTrue code to execute if true
     * @param {Expression} ifFalse code to execute if false
     * @param {Object} position a position from nearley
     */
    constructor (condition: Expression, ifTrue: Expression, ifFalse: Expression, position: Object) {
        super(position);
        
        /** @type {Expression} */
        this.condition = condition;
        
        /** @type {Expression} */
        this.ifTrue = ifTrue;
        
        /** @type {Expression} */
        this.ifFalse = ifFalse;
    }
    
    clone() {
        return new Ternary(
            this.condition.clone(),
            this.ifTrue.clone(),
            this.ifFalse.clone()
        )
    }
    
    /** @override */
    get children() {
        return ['condition', 'ifTrue', 'ifFalse'];
    }
}
