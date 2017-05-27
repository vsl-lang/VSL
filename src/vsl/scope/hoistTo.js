/**
 * Hoists `CodeBlock`s to a root one, used for things such as module imports.
 * 
 * @param {Scope} root - root scope as source. Items will be hoisted onto here.
 * @param {Scope} hoistee - An array of scopes to hoist onto the root
 * @param {boolean} [priority=true] - If true: if a hoistee has an item which
 *     the root also has, the hoistee should be valid and the root should be
 *     blamed.
 * @return {?ScopeItem} If returned, this is the conflicting scope item
 *     (i.e. error)
 */
export default function hoistTo(root: Scope, hoistee: Scope, priority: boolean = true): ScopeItem {
    for (let [k, value] of hoistee) {
        let res = root.set(value);
        if (res === false) return root.get(value);
    }
    
    return null;
}