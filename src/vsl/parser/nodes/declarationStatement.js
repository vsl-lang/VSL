import Node from './node';

/**
 * Matches a generic declaration, obviously don't construct directly (because
 * this is abstract). This just manages info that all declarations share so that
 * you can do stuff for all declarations at once.
 *
 * @abstract
 */
export default class DeclarationStatement extends Node {
    /**
     * Creates a new declaration statement. You shouldn't call this directly
     * rather subclass this class.
     *
     * @param {string[]} access - The access modifiers of the node
     * @param {Object} position - A position object from nearley.
     */
    constructor(access, position) {
        super(position);
        
        /**
         * List of access modifiers
         * @type {string[]}
         */
        this.access = access;
        
        /**
         * Reference to type item.
         * @type {?ScopeItem}
         */
        this.reference = null;
    }
}
