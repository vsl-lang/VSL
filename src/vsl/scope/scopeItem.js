/**
 * A generic scope item, specifying primarially the value of any identifier.
 * This specifies behavior for type matching and also getting and setting the
 * scope item, used for type checking. It should hold information and be
 * compliant for type inference if applicable.
 * 
 * @abstract
 */
export default class ScopeItem {
    /**
     * Do **not** directly construct.
     * 
     * @param {string} id - The string name of the object
     */
    constructor(id) {
        /**
         * The string name of the scope item
         */
        this.id = id;
        
        // Contains the original ID name in case of mangling.
        /**
         * The original name, never mangled.
         */
        this.original = null;
    }
    
    /**
     * Determines whether two `ScopeItem`s are the same.
     * 
     * @param {ScopeItem} signature - The value of the other scope item. It will
     *     be of the same subclass
     * @return {bool} Indicates whether or not the `signature` is the same.
     * 
     * @abstract
     */
    compare(signature: ScopeItem) {
        throw new Error("ScopeItem#compare(signature:) must be overriden");
    }
}