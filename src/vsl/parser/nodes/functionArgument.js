import Node from './node';

/**
 * Represents a function argument
 */
 
export default class FunctionArgument extends Node {
    
    constructor(typedId: TypedIdentifier, defaultValue: Expression, position: Object) {
        super(position);
        
        /** @type {string} */
        this.typedId = typedId;
        this.defaultValue = defaultValue;
    }
    
    /** @override */
    get children() {
        return ['defaultValue'];
    }
    
    /** @override */
    toString() {
        return `${this.typedId}${this.defaultValue ? " = " + this.defaultValue : ""}`
    }
}
