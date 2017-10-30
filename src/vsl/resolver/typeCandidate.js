/**
 * A really simple wrapper class which represents a type candidate, this wraps
 * a {@link ScopeItem} which you can use to
 */
export default class TypeCandidate {
    /**
     * Create new type candidate with spec. prec. if app.
     * @param {ScopeItem} candidate - The type candidate
     * @param {?boolean} [precType=null] - null if not applicable, false if
     *                                   explictly declared not, and true if
     *                                   explicitly declared as.
     */
    constructor(candidate, precType = null) {
        /** @type {ScopeItem} */
        this.candidate = candidate;
        
        /** @type {?boolean} */
        this.precType = precType;
    }
    
    /** @override */
    toString() {
        return `${this.candidate}${this.precType ? "!" : ""}`;
    }
    
    /**
     * Simplifies a list of candidates as a final step to attempt to solve
     * ambiguity. If called by a third-stage traverser and this returns more
     * than one item then you have a definite ambiguity bork.
     *
     * @param  {TypeCandidate[]} candidates list of candidates:
     *                                      `node.typeCandidates`.
     * @return {TypeCandidate[]}            Adjusted type candidates simplified.
     */
    simplify(candidates: TypeCandidate[]) {
        // These cases are already resolved
        if (candidates.length <= 1) return candidates;
        
        // This will choose a precType over non-prec types.
        let fixed = null; // Stores the prec candidate
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].precType === null) return [];
            if (candidates[i].precType === true) {
                if (fixed !== null) return [];
                fixed = candidates[i].resolved();
            }
        }
        
        return [fixed];
    }
}
