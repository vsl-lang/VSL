import Node from './node';

/**
 * Used to specify that the parent's implementation is internally defined.
 */
export default class InternalMarker extends Node {
    
    /**
     * Creates a marker
     * @param {Object} position - a position from nearley
     */
    constructor (position: Object) {
        super(position);
    }
    
    /** @override */
    get children() {
        return null;
    }
}