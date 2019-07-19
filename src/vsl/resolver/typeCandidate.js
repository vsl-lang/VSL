/**
 * A really simple wrapper class which represents a type candidate, this wraps
 * a {@link ScopeItem} which you can use to
 */
export default class TypeCandidate {
    /**
     * Create new type candidate with spec. prec. if app.
     * @param {ScopeItem} candidate - The type candidate
     * @param {number} [precType=0] - 0 if not applicable, 0 if
     *                                   explictly declared not, and 1 if
     *                                   explicitly declared as. More prec is
     *                                   greater positive number.
     */
    constructor(candidate, precType) {
        /** @type {ScopeItem} */
        this.candidate = candidate;

        /** @type {?number} */
        this.precType = precType || 0;
    }

    /** @override */
    toString() {
        return `${this.candidate}${this.precType ? "!" : ""}`;
    }
}
