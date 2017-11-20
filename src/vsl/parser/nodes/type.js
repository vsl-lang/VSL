import Node from './node';

/**
 * Type chain expression such as `A.B`
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
    }
    
    clone() {
        return new Type(
            this.head.clone(),
            this.tail.clone()
        );
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
