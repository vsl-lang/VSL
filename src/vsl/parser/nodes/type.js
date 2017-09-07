import Node from './node';

/**
 * Wraps a type
 * 
 */
export default class Type extends Node {
    
    constructor(
        head: Node,
        tail: Node,
        optional: bool,
        position: Object
    ) {
        super(position);
        
        /** @type {Node} */
        this.head = head;
        
        /** @type {Node} */
        this.tail = tail;
        
        /** @type {bool} */
        this.optional = optional;
    }
    
    /** @override */
    get children() {
        return ['head', 'tail'];
    }
    
    /** @override */
    toString() {
        return this.head.toString() + '.' + this.tail.toString() + (this.optional ? "?" : "");
    }
}