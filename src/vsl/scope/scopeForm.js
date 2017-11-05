/**
 * Refers to a specific form of a {@link ScopeItem}
 *
 * @typedef {Object} ScopeForm
 * @property {Symbol} definite - Fully resolved type.
 * @property {Symbol} indefinite - Partially resolved type, resolve using
 *                               `.resolve()` or `.resolved()`
 * @property {Symbol} query - Type of a query reference.
 */
export default {
    indefinite: Symbol('ScopeForm.indefinite'),
    definite: Symbol('ScopeForm.definite'),
    query: Symbol('ScopeForm.query')
};
