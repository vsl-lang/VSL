import ScopeAliasItem from './items/scopeAliasItem';
import ScopeFuncItem from './items/scopeFuncItem';
import ScopeForm from './scopeForm';

// This counts the amount of unique IDs. This is suffixes to always ensure a
// unique name which makes life much easier.
/** @private */
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
 * ### Hashing
 *
 * Essentially we have a `HashTable<ID, LinkedList<T: ScopeItem>>` where we can
 * obtain a `O(1)` lookup time to obtain all possible candidates. Might actually
 * not be a linked list but hash table always use linked list so why not.
 *
 */
export default class Scope {
    /**
     * Initalizes an empty scope.
     * @param {Scope} [parent=null] - The parent scope of this. Use `hoistTo` to
     *     join two scopes.
     */
    constructor(parentScope: Scope = null) {
        /**
         * Contains all scope data. DO NOT directly modify.
         * @type {Map<string, ScopeItem[]>}
         */
        this.ids = new Map();

        /**
         * Stores immediate aliases for layout purposes
         * @type {ScopeAliasItem[]}
         */
        this.aliases = [];

        /**
         * Gtores immediate functions for layout purposes
         * @type {ScopeFuncItem[]}
         */
        this.functions = [];

        /**
         * @private
         */
        this.parentScope = parentScope;

        if (this.parentScope) {
            this.parentScope.subscopeCount++;
        }

        /**
         * If this scope is owned, this represents the owner
         * @type {?ScopeTypeItem}
         */
        this.owner = null;

        /**
         * Represents the depth of this scope
         * @type {number}
         */
        this.depth = (this.parentScope?.depth || 0) + 1;

        /**
         * Stores index in parent scope
         * @type {number}
         */
        this.scopeOffset = this.parentScope?.subscopeCount || 0;

        /**
         * Counts the amount of child scopes. Updated by child scopes.
         * @type {number}
         */
        this.subscopeCount = 0;

        /**
         * If this scope is static
         * @type {boolean}
         */
        this.isStaticContext = false;

        this._isSemanticScope = true;
    }

    /**
     * The scope that is the immediate parent of this.
     * @type {?Scope}
     */
    get superscope() {
        return this.parentScope;
    }

    /**
     * Readjusts the parent scope of this.
     * @type {?Scope}
     */
    set superscope(newSuperscope) {
        // Don't care about adjusting old counts yet.
        const oldScope = this.parentScope;

        this.depth = (newSuperscope?.depth || 0) + 1;
        this.scopeOffset = newSuperscope?.subscopeCount || 0;
        if (newSuperscope) newSuperscope.subscopeCount++;

        this.parentScope = newSuperscope;
    }

    /**
     * If this scope is semantic (delimited by codeblock)
     * @type {boolean}
     */
    get isSemanticScope() {
        return this._isSemanticScope;
    }

    /**
     * If this scope is semantic (delimited by codeblock)
     * @type {boolean}
     */
    set isSemanticScope(newIsSemanticScope) {
        this._isSemanticScope = newIsSemanticScope;
    }

    /**
     * Uniquely ids scope.
     */
    get scopeId() {
        const localName = this.owner?.uniqueName || "g";
        const localId = `${this.isStaticContext ? "S" : ""}${localName}`;
        if (this.parentScope === null)  {
            return localId;
        } else {
            return `${this.parentScope.scopeId}${localId}`;
        }
    }

    /**
     * Returns all {@link ScopeItem}s in the scope with the given root ID. Used
     * for obtaining all candidate items for some processes.
     *
     * @param {string} id - Returns the matching item from the scope.
     * @return {?ScopeItem[]} null if the item could not be obtained
     */
    getAll(id: string): ?ScopeItem[] {
        // TODO: Optimize to not use this
        let items = (this.ids.get(id) || []).slice();

        this.parentScope?.getAll(id).forEach(
            item => {
                let isDuplicate = items.some(
                    existing => existing.equal(item.getQuery())
                );

                if (!isDuplicate) items.push(item);
            }
        );

        return items;
    }

    /**
     * Matches an associated `ScopeItem`. Returns null if it can't find that
     * reference.
     *
     * @param {ScopeItem} item - Indefinite scope item. For a lookup for an
     *     applicable matching scope item. **Query** type.
     * @return {?ScopeItem} A reference to the matching scope item
     */
    get(item) {
        if (item.form !== ScopeForm.query) return null;

        let candidates = this.getAll(item.rootId);
        if (candidates.length === 0) return null;

        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].equal(item)) {
                return candidates[i];
            }
        }

        return null;
    }

    /**
     * The exact same as {@link Scope#get} however also sets a reference for
     * the {@link ScopeItem#references} if exists.
     *
     * @param {ScopeItem} item - An item to lookup for an applicable matching
     *     scope item. **Query type**.
     * @param {Node} node - referencing node that the requestor is delegating.
     * @return {?ScopeItem} A reference to the matching scope item.
     */
    getAsDelegate(item, node) {
        let reference = this.get(item);
        if (reference === null) return null;

        reference.references.push(node);

        // If it is private we'll have to check we are accessing it correctly.
        if (!node.parentScope.scope.canAccess(reference)) {
            return null;
        }
        return reference;
    }

    /**
     * Determines if a value is accessible from this scope
     * @param {ScopeItem} reference the item
     * @return {boolean} if it can.
     */
    canAccess(reference) {
        if (reference.isScopeRestricted) {
            // If we are accessing it from a **not allowed** scope.
            if (!this.inScopeChain(reference.owner)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Checks if a scope is in the current scope chain
     * @param {Scope} scope
     * @return {boolean}
     */
    inScopeChain(scope) {
        let scopeChain = this;
        while (scopeChain) {
            if (scopeChain === scope) {
                return true;
            } else {
                scopeChain = scopeChain.parentScope;
            }
        }
        return false;
    }

    /**
     * Determines whether the **current** scope has a candidate for a given
     * template.
     *
     * @param {ScopeItem} item - The item to check if a candidate exists for it
     *     remember, this only checks in the current scope! Query type
     * @return {boolean} Whether or not it exists
     */
    has(item: ScopeItem): boolean {
        let candidates = this.getAll(item.rootId);
        if (!candidates) return false;

        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].equal(item)) return true;
        }

        return false;
    }

    /**
     * Sets a key in this scope to the {@link ScopeItem}. Note: This DOES NOT
     * update an existing key, this will return `false` is there is a duplicate.
     *
     * @param {ScopeItem} item - The item to add to this scope.
     * @return {boolean} this will return `false` if the item has already been
     *     declared in the scope. In that case you should throw an error
     *     otherwise major borks could happen.
     */
    set(item: ScopeItem): boolean {
        let candidates = this.ids.get(item.rootId);
        if (candidates) {
            item.owner = this;
            item.id = candidates.length;
            candidates.push(item);

            if (this.get(item.getQuery()) !== item) {
                candidates.pop();
                return false;
            }

        } else {
            item.owner = this;
            item.id = 0;
            this.ids.set(item.rootId, [item])
        }

        // Special behavior for fields. Add to list
        if (item instanceof ScopeAliasItem) {
            this.aliases.push(item);
        } else if (item instanceof ScopeFuncItem) {
            this.functions.push(item);
        }

        return true;
    }

    /**
     * Helper function which generates a scope's visualization. Used for
     * debugging and reference
     *
     * @return {string} The visualized scope.
     */
    toString() {
        let root = `\u001B[1mScope\u001B[0m`;

        function indent(strings) {
            return strings.map(
                (string, index, array) => string
                    .split(`\n`)
                    .map((line, index) => '  ' + (
                        array.length - 1 === index ?
                            (index === 0 ? '├' : '│') :
                             (index === 0 ? '└' : ' ')
                        ) + ' ' + line).join(`\n`)).join(`\n`)
        }

        const items = [];
        for (const [id, items] of this.ids) {
            const item = id + '\n';
            const children = items.map(
                item => {
                    let itemString = item.toString();

                    // Get the item subscope if it exists
                    if (item.subscope) {
                        itemString += '\n' + item.subscope.toString();
                    }

                    return itemString;
                }
            )

            items.push(item + indent(children));
        }

        const final = root + '\n' + indent(items);
        return final;
    }
}
