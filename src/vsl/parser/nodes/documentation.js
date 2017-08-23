import Node from './node';

// TODO: documentation
export default class Documentation extends Node {
    
    /**
     * TODO
     * 
     * @param {string} documentation
     * @param {Object} position a position from nearley
     */
    constructor (documentation: string, position: Object) {
        super(position);
        
        /** @type {string} */
        this.documentation = documentation;
    }
    
    /** @override */
    get children() {
        return null;
    }
    
    /** @override */
    toString() {
        return this.literal;
    }
}
