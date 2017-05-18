import Node from './node';

/**
 * Wraps a generic class declaration
 * 
 */
export default class GenericDeclaration extends Node {
    
    constructor(
        type: Identifier,
        parameters: Identifier[],
        defaultType: Identifier,
        optional: bool,
        position: Object
    ) {
        super(position);
        
        /** @type {Identifier} */
        this.type = type;

        /** @type {Identifier[]} */
        this.parameters = parameters;
        
        /** @type {Identifier} */
        this.defaultType = defaultType;
    }
    
    /** @override */
    get children() {
        return [this.typ].concat(this.parameters);
    }
}