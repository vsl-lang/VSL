import ScopeItem from './scopeItem';

/**
 * Represents the implementation of an abstract {@link ScopeGenericItem}. This
 * basically represents a 'specialization' of a class. To do this we:
 *  - Copy the scope (not the scope items)
 *  - Add typealises for the generic parameters
 *
 * Note to self: this means that the 'self' contextual variable is dependent on
 * call semantics, it cannot be inferred and the callee signifies this.
 * Obviously the compiler ensures saftey in this situation but just FYI.
 *
 * Additionally we have 'genericOwners[]' now on all scope items which specifies
 * which {@link ScopeGenericItem}s specialize that given function, this helps
 * both the backend and frontend determine where we can infer.
 */
export default class ScopeGenericImplementation extends ScopeItem {
    /**
     * Implementation of a generic, manages a subscope
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - Do not override. Should be 'init' in ALL cases.
     * @param {Object} data - Information about the class
     * @param {ScopeGenericItem} sourceClass - Implementing this class
     * @param {ScopeTypeItem} params - These must conform to sourceClass's parents
     *                                 else undefined behavior
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);

        /** @type {ScopeGenericItem} */
        this.sourceClass;

        /** @type {ScopeTypeItem[]} */
        this.params;
    }

    init({ sourceClass, params, ...opts }) {
        super.init(opts);

        this.sourceClass = sourceClass;
        this.params = params;
    }
}
