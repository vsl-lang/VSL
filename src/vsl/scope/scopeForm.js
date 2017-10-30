/**
 * Refers to a specific form of a {@link ScopeItem}
 *
 * @typedef {Object} ScopeForm
 * @property {Symbol} definite - Fully resolved type.
 * @property {Symbol} query - Type of a query reference.
 */
export default {
    definite: Symbol('ScopeForm.definite'),
    query: Symbol('ScopeForm.query')
};
