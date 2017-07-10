import Node from './node';

export default class GetterSetter extends Node {
    
    /**
     * Creates a wrapper for literals
     * 
     * @param {string} literal the literal string value of the literal
     * @param {number} type The literal type as from a TokenType
     * @param {Object} position a position from nearley
     */
    constructor (getter: Getter, setter: Setter, position: Object) {
        super(position);
        
        /** @type {Getter} */
        this.getter = getter;
        
        /** @type {Setter} */
        this.setter = setter;
    }
    
    /** @override */
    get children() {
        return null;
    }
    
    /** @override */
    toString() {
        return (this.getter || ''.toString() + (this.setter || '').toString();
    }
}