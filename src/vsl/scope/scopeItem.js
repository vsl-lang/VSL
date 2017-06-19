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
     * @param {string} rootId - the root identifier in a declarations
     */
    constructor(rootId: string) {
        /**
         * The string name of the scope item
         *
         * @type {string}
         */
        this.rootId = rootId;

        /**
         * All items which reference this scope item
         *
         * @type {Node[]}
         */
        this.references = []

        /**
         * The type of the given item. For:
         *
         *  - ScopeItem -> ScopeTypeItem
         *  - ScopeFuncItem -> ScopeTypeItem (function)
         *  - ScopeTypeItem -> ScopeMetaClass
         *
         * @type {ScopeItem}
         * @protected
         */
        this.type = null;
    }

    /**
     * Determines whether two `ScopeItem`s matches eachother. You can use this
     * to verify a candidate matches the prototype.
     *
     * @param {ScopeItem} ref - The value of the other scope item. It will
     *     be of the same subclass
     * @return {bool} Indicates whether or not the `signature` is the same.
     *
     * @abstract
     */
    equal(ref: ScopeItem): boolean {
        return ref.rootId === this.rootId;
    }
}
