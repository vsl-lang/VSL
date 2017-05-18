/**
 * Represents all information about a VSL variable or identifier.
 */
export default class Id extends ScopeItem {
    
    /**
     * @param {string} name - Identifier name
     * @param {?Type} type - Identifier type
     */
    constructor(name: string, type: ?Type) {
        super(name);
        this.type = type;
    }
}