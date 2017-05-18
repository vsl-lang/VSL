/** @private */
// This counts the amount of unique IDs. This is suffixes to always ensure a
// unique name which makes life much easier.
let ID_COUNTER = 0;

/**
 * Wraps a scope, encapsulates mangling, get/set, and overloading. Check if what
 * you want can be done with an ASTTool and this is a lightweight wrapper and
 * does not implement any recursion/traversing.
 * 
 * ### Implementation
 * This is implemented with two primary fields:
 *  - ids: [String: Id]
 *  - types: [Type]
 * 
 * An ID is used so an O(1) lookup time can be obtained for variables and
 * identifiers. However for types, such are complex and therefore a simple string
 * lookup won't suffice, a sequential search must be done as this would also be
 * used for checking type and declarations. For example `a: Int -> Void` and
 * `a: Double -> Void` are both unique and must be disambiguated.
 * 
 * The generated IR does not specifically create a unique identifier for each,
 * fields are still mangles and due to compile-time inheritance. `super` would
 * result in conflicts when overriding certain classes. Therefore `super.foo`
 * if a `self.foo` exists would refer to the `super` field.
 * 
 * Operators are also compiled to functions. That said, the transformation pass
 * converts the desired unmangled `Int.==` to a `add` instruction directly.
 * 
 */
export default class Scope {
    /**
     * Takes no arguments and initalizes an empty scope. 
     * 
     */
    constructor() {
        /**
         * Contains variable IDs which have a type
         * @private
         */
        this.ids = new Map();
    }
    
    /**
     * Returns the associated type information for an id
     * 
     * @param {string} id - Returns the matching item from the scope.
     * @return {?ScopeItem} null if the item could not be obtained
     */
    getId(id: ScopeItem): ScopeItem {
        // String argument === Id
        // Also maybe an `Id` class which in case unwrap.
        return this.ids.get(id.name);
    }
    
    /**
     * Obtains all candidate scope items, 
     */
    getMatches(name: string) {
        let id = this.ids.get(name);
        return id ? [id] : [];
    }
    
    /**
     * Obtains an unmangled version of the name
     * 
     * @param {string} id - Returns the matching item from the scope.
     * @return {?ScopeItem} null if the item could not be obtained
     */
    getUnmangled(id: ScopeItem) {
        let value = null;
        let ctor = id.constructor;
        for (let [k, v] in this.ids) {
            if (v instanceof ctor && v.compare(id)) {
                value = v;
                break;
            }
        }
        return value;
    }
    
    /**
     * This will mangled the name for a given id. If the ID does not exist, this
     * will automatically set the name. Make sure you specify the
     * `.compare(signature:)` function on the {@link ScopeItem} to avoid issues.
     * 
     * This ScopeItem itself may contain a mangled name, however this function
     * will just wrap up that process in generating one too.
     * 
     * @param {string} id - Reference `#get(id:)` for information on this
     * @return {string} the mangled id as a string. Can be discarded.
     */
    set(id: ScopeItem) {
        let finalId = id.name + "_" + (ID_COUNTER++);
        id.name = finalId;
        this.ids.set(finalId, id);
        
        return finalId;
    }
}