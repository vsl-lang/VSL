import Node from './node';

/**
 * Used to specify that the parent's implementation is externally defined.
 */
export default class ExternalMarker extends Node {
    
    /**
     * Creates a marker
     * @param {String} id - the literal ID to bind to.
     * @param {Object} position - a position from nearley
     */
    constructor(id: String, position: Object) {
        super(position);
        this.rootId = id;
    }
    
    /** @override */
    get children() {
        return null;
    }
    
    toString() {
        return `external(${this.rootId})`;
    }
}
