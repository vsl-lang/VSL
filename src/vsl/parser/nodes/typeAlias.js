import Node from './node';

/**
 * Wraps a type alias
 * 
 */
export default class TypeAlias extends Node {
    
    constructor(
        modifiers: string[],
        name: Identifier,
        type: Type,
        position: Object
    ) {
        super(position);
        
        /** @type {string[]} */
        this.modifiers = modifiers;
        
        /** @type {Identifier} */
        this.name = name;
        
        /** @type {Type} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return ['modifiers', 'name', 'type']
    }
}