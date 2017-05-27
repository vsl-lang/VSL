import Node from './node';

/**
 * Wraps a generic type
 * 
 */
export default class Generic extends Node {
    
    constructor(
        type: Identifier,
        parameters: Identifier[],
        position: Object
    ) {
        super(position);
        
        /** @type {Identifier} */
        this.type = type;

        /** @type {Identifier[]} */
        this.parameters = parameters;
    }
    
    /** @override */
    get children() {
        return [this.typ].concat(this.parameters);
    }
    
    /** @override */
    toString() {
        return `${this.type.identifier.rootId}<${this.parameters.join(", ")}>`
    }
}