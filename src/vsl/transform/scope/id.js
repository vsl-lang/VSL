/**
 * Represents all information about a VSL variable or identifier.
 */
export default class Id {
    
    /**
     * @param {bool} mutable - Whether the id is a constant
     * @param {?Type} type - The type of the variable. `nil` specifies the type
     *     is yet to be deduced
     * @param {Node} source - The statement source
     */
    constructor(mutable: bool, type: ?Type, source: Node) {
        this.mutable = mutable;
        this.type = type;
        this.source = source;
    }
}