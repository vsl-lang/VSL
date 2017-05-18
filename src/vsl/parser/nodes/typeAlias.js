import Node from './node';

/**
 * Wraps a type alias
 * 
 */
export default class TypeAlias extends Node {
    
    constructor(
        name: Identifier,
        type: Type,
        position: Object
    ) {
        super(position);
        
        /** @type {Identifier} */
        this.name = name;
        
        /** @type {Type} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return ['name', 'type']
    }
}