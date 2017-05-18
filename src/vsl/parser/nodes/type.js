import Node from './node';

/**
 * Wraps a type
 * 
 */
export default class Type extends Node {
    
    constructor(
        path: Node[],
        optional: bool,
        position: Object
    ) {
        super(position);
        
        /** @type {Node[]} */
        this.path = path;
        
        /** @type {bool} */
        this.optional = optional;
    }
    
    /** @override */
    get children() {
        return ['path'];
    }
}