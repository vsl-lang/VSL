import t from '../parser/nodes';
import TypeResolutionError from './typeResolutionError';

/**
 * Itself resolves an expressions types like magic
 *
 * ---
 *
 * These are a series of classes and functions which serve to perform type
 * deduction on `ExpressionStatement`s. Because examples such as these exist:
 *
 *     var a: T = b
 *
 * where `typeof b is T`, the `T` context is needed to perform the cast. These are
 * considered as "Context Constriants" which are generate as much as possible, then
 * one-by-one each is resolved. If ambiguity or no applicable type could be fount
 * then an error is thrown.
 *
 * ## Process
 * There are two main processes:
 *
 *  - Constraints
 *  - Resolution
 *
 * each of them has their own workings which are encapsulated. However beacuse the
 * type resolver functions recursively, only one node at a time, bottom-up is
 * resolved using a custom post-order traverser. The traverser itself is recursive
 * and does not have a seperate stack.
 *
 * ### Constraints
 * A constriant has three states:
 *
 *  - Requested: A fallback when it was not possible to deduct using desired traits
 *  - Desired: A trait which must be satisfied
 *
 * A rough overview of the constraints are in the 'constraintType' file
 *
 * As the bottom-up recursion goes, the subclass can "negotiate" the type with the
 * parent by specifiying attempts and recieing the possibilities, such negotiations
 * may traverse above the tree and allow the following to be satified:
 *
 *     func f(a: Int) -> String { ... }
 *     func f(a: Double) -> Int { ... }
 *
 *     let a: String = f(a: f(a: 5))
 *
 * which resolved by:
 *
 *      1       | f(a: 5)      | Int, Double
 *      |- 2    | a: f(...)    | Int, Double
 *         |- 3 | f(a: f(...)) | String(Int)
 *         |- 2 | a: f(...)    | Int
 *         |- 1 | f(...)       | Int(Double)
 *
 * Now `a: 5` can be determined to be `f(a: 5 as Int)`.
 *
 * ## Expression Node Types
 * There is a differentiation between two types in an expression:
 *
 *  - Atomic types
 *  - Complex types
 *
 * Atomic types only need one non-conflicting constraint to be specified.
 *
 */
export default class TypeResolver {
    /**
     * Creates a type offer with a negotation function.
     *
     * @param {Node} node - The node to resolve.
     * @param {function(from: Node): TypeResolver} getChild - Takes a node and
     *     returns the resolver to execute, it is reccomended to just use a
     *     `switch` statement with `from.constructor` and then use that. It is
     *     fine to throw if the node is unhandled.
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver
    ) {
        this.node = node;
        this.getChild = getChild;

        /** @private */
        this.upwardNegotiationValues = new Map();
    }

    /**
     * Returns plane intersection plane bounds.
     * @private
     */
    _intersect(rootSet, appliedSet) {
        if (rootSet === null && appliedSet === null) {
            this.emit(
                `No valid type candidates on both intersection planes. Likely` +
                ` you created a variable without any type which doesn't make ` +
                `any sense so now we're throwing this error as a way of the ` +
                `compiler saying 'wat'.`
            );
        }

        if (appliedSet === null || rootSet === null) {
            return null;
        }

        let derivedCandidates = [];

        // Iterate through each of the valid candidates
        // we need to check that one of the
        for (let i = rootSet.length - 1; i >= 0; i--) {
            let rootItem = rootSet.pop();
            let match = null;

            // Look for an applied candidate that matches the current rootSet.
            for (let j = appliedSet.length - 1; j >= 0; j--) {
                if (appliedSet[j].candidate.resolved().castableTo(rootItem.candidate)) {
                    match = appliedSet[j];
                    break;
                }
            }

            // If there is one, this is a succesful candidate match.
            if (match !== null) {
                derivedCandidates.push({
                    root: rootItem,
                    value: match
                });
            }
        }

        return derivedCandidates;
    }

    /**
     * Performs a set-intersection between two types, you can specify error
     * handling to centralize errors caused.
     *
     * Previously this used to be a bit more complex but since then the type
     * system has been modified and some simplifications have been made.
     *
     * To understand this:
     *
     * ```
     * let t: rootType = appliedType
     * ```
     *
     * Now it is possible to have a situation where the rootType and the
     * appliedType is ambiguous. What this does is you provide it the
     * possible rootTypes and the possible appliedTypes and this returns the
     * valid appliedTypes.
     *
     * (ignore everything below)
     *
     * ## Problem
     *
     * Type intersection is a little on the complex side so I've attempted to
     * piece together an explanation which explains both what and _why_ this
     * works as such.
     *
     * We have two 'types' of candidates:
     *
     *  - Root: A type we're trying to fit an applied type into
     *  - Applied: A type that should fit into at least one root
     *  - Intersetion: A tuple of a (Root, Applied) pair which satisfies
     * each other. We can call this tuple a 'derived candidate'
     *
     * As you can see we're trying to draw a path between the root and applied
     * types to create the intersection types. The types we want should form a
     * pair and we can discard the others. However this needs to be mutating as
     * the root _set_ needs to match \\(C_T\\) (more on this later). The same
     * needs to happen with the applied set.
     *
     * ## Approach
     *
     * Since we're trying to 'fit' an intersection into the root and applied,
     * you can think of the types as a three-dimentional figure which we're
     * trying to find an _intersection plane_ which satisfies our problem. So
     * we can label our dimensions as:
     *
     *  - \\(D_1\\): the set of root candidates (x)
     *  - \\(D_2\\): the set of applied candidates (y)
     *  - \\(D_3\\): the intersection plane set (z)
     *
     * This lets us also imagine this as:
     *
     * $$D_1 \cap D_2 = D_3$$
     *
     * but there is a problem as \\(\forall c \in D_3 . c_T \in D_1 \land c_V \in D_2\\),
     * where \\(c\\) is a candidate, \\(c_T\\) is a root type and \\(c_V\\) is an
     * applied type.
     *
     * What is the problem? It's the fact that the result of a set intersection
     * is a tuple of both sets. This is where the 3D analogy comes in, We have a
     * 3d object, and the \\(\left\(x, y\right\)\\) refers to \\(\left\(D_1, D_2\right\)\\)
     * which happens to refer to our original sets.
     *
     * Now you're probably saying how could one match a plane on a 3D object where
     * the points are not linear. You're right in saying that so that means we
     * must reorganize and reshape or 3D object (which is why I never specifically
     * reffered to it as a 'rectangular prism' or 'cube'). This is the reorganizing
     * which usually would take \\(O(n\uparrow 2)\\) which is absured, but for
     * an intersection it is merely an \\(O(n^2)\\) process to identify a point
     * on \\(D_3\\). Solution? That's a good question, so that is what we attempt
     * to do here.
     *
     * @param  {TypeCandidate[]} targetSet   The base set which to perform
     *                                       matching against. This means a item
     *                                       from an appliedSet could be upcast
     *                                       to match this, but not the other
     *                                       way. This is generally the static
     *                                       set, e.g. the function arg list.
     * @param  {TypeCandidate[]} appliedSet  This is the deductee set which will
     *                                       be matched to a rootSet.
     * @param {TransformationContext} ctx    The negotiated transformation
     *                                       context.
     * @return {ScopeTypeItem[]} the appropriate types from the **appliedSet**
     */
    typeIntersect(appliedSet, targetSet, ctx) {
        const validTypes = [];

        main:
        for (let i = 0; i < appliedSet.length; i++) {
            const appliedCandidate = appliedSet[i];

            for (let j = 0; j < targetSet.length; j++) {
                const targetType = targetSet[j].candidate;

                if (ctx.contextuallyCastable(appliedCandidate.candidate, targetType)) {
                    validTypes.push(appliedCandidate);

                    // We already found that this appliedType can work so we
                    // don't need to check the others
                    continue main;
                }
            }
        }

        return validTypes;
    }


    /**
     * Resolves types for a given node.
     *
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     *
     * @abstract
     */
    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        throw new TypeError("resolve must be overriden");
    }

    /**
     * Negotiates upward, you can use this when you wish to pass some
     * information independent of the return candidate.
     * @param {ConstraintType} constraint
     * @param {Object} value
     */
    negotiateUpward(constraint, value) {
        this.upwardNegotiationValues.set(constraint, value);
    }

    /**
     * Call this from a higher negotiator, this returns a negotiation proposal
     * from this resolution node
     * @param {ConstraintType} constraint
     * @return {?Object} contraint value
     */
    getNegotiatationProposal(constraint) {
        return this.upwardNegotiationValues.get(constraint);
    }


    /**
     * Emits an error. Usually used when a type conflict is encountered.
     *
     * @param {string} message - The messaging describing the bork. Please make
     *     it as clear as possible to make fixing the bork as easy as possible.
     * @param {Object} ref     - The referencing error object providing error
     *     type info.
     * @throws {TransformError} - Throws this error based on infos.
     */
    emit(message: string, ref: Object) {
        throw new TypeResolutionError(message, this.node, ref);
    }
}
