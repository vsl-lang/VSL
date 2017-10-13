/**
 * Refers to a specific form of a {@link ScopeItem}
 *
 * @typedef {Object} ScopeForm
 * @property {Symbol} indefinite - Indefinite or partially resolved type.
 * @property {Symbol} definite - Fully resolved type.
 * @property {Symbol} query - Type of a query reference.
 */
export default {
    indefinite: Symbol('ScopeForm.indefinite'),
    definite: Symbol('ScopeForm.definite'),
    query: Symbol('ScopeForm.query')
};
