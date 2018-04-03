import Node from './node';

/**
 * Matches whatever
 */
export default class Whatever extends Node {
    
    /**
     * Creates a wrapper whatever
     * 
     * @param {Object} position a position from nearley
     */
    constructor (position: Object) {
        super(position);
    }
    
    /** @override */
    get children () {
        return [];
    }
    
    /** @override */
    toString () {
        return '?';
    }
}
