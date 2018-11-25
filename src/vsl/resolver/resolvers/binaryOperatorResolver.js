import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeFuncItem from '../../scope/items/scopeFuncItem';

import e from '../../errors';

/**
 * Resolves binary operator calls. This is NOT an atomic operation. This uses
 * will find the defined static function.
 */
export default class BinaryOperatorResolver extends TypeResolver {

    /**
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
        super(node, getChild);
    }

    /**
     * Resolves types for a given node.
     *
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     */
    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        const opName = this.node.op;
        const lhs = this.getChild(this.node.lhs);
        const rhs = this.getChild(this.node.rhs);

        // Get requested resolution constraint
        const requestedType = negotiate(ConstraintType.RequestedTypeResolutionConstraint)?.candidate.resolved();

        // If a definite deduction is expected
        const simplifyToPrecType = negotiate(ConstraintType.SimplifyToPrecType);

        // If at least one type is expected
        const requireType = negotiate(ConstraintType.RequireType);

        // This will resolve the arguments
        const resolver = (type) => {
            switch (type) {
                // The child cannot be voidable
                case ConstraintType.VoidableContext: return false;

                // By default we want all candidates
                case ConstraintType.RequestedTypeResolutionConstraint: return null;

                // Don't simplify that's what we'll do
                case ConstraintType.SimplifyToPrecType: return false;

                // Propogate negotation as this only handles the one
                default: return negotiate(type);
            }
        };

        // Creates a resolver with a prec type
        const finalResolver = (reqRes) => (type) => {
            switch (type) {
                case ConstraintType.VoidableContext: return false;
                case ConstraintType.RequestedTypeResolutionConstraint: return reqRes;
                default: return negotiate(type);
            }
        };

        // Get type candidates of LHS and RHS tyoes
        const lhsTypes = lhs.resolve(resolver);
        const rhsTypes = rhs.resolve(resolver);

        // We'll store an object of { lhsType, rhsType, candidate, precCount }
        // which is which op candidate works and w/ what types. precCount is
        // how many args are prec candidates.
        let operatorCandidates = [];

        // Try all candidates `Class(of: LHS)` has
        let lastHighestPrec = 0;

        // This stores the highest prec candidate. If they are multiple
        // then we'll make this `null`
        let highestPrec = null;
        for (let i = 0; i < lhsTypes.length; i++) {
            const lhsType = lhsTypes[i].candidate.resolved();

            // The operator candidates for this type.
            const candidates = lhsType.staticScope.getAll(opName);

            for (let j = 0; j < candidates.length; j++) {
                // If we have a dual prec. prec. case and this isn't prec we'll
                // give up since no prec types here.
                if (lastHighestPrec > 1 && rhsTypes.precType === false)
                    continue;

                // Is binary operator so *must* have 2 args
                if (candidates[j].args.length === 2) {
                    // If provided, check if requestedType matches. If it does
                    //  not, skip it.
                    if (requestedType && !candidates[j].returnType.castableTo(requestedType)) {
                        continue;
                    }


                    // Check that they work for RHS since LHS must be type\
                    // anyway. This is ensured by VerifyOperatorOverload
                    for (let k = 0; k < rhsTypes.length; k++) {
                        // Get the amount of prec types
                        const precScore = lhsTypes[i].precType + rhsTypes[k].precType;

                        // If prec score is lower don't waste time checking cast.
                        // If they are the same we will set the `highestPrec`
                        //  which stores the index of the single highest prec
                        //  item. This becomes null if multiple.
                        if (precScore < lastHighestPrec) {
                            continue;
                        }

                        // Check if the RHS type works for this operator
                        // candidate. The second arg (.args[1]) refers to the
                        // RHS as the format is +(lhs, rhs)
                        const rhsCandidate = rhsTypes[k].candidate.resolved();
                        if (rhsCandidate.castableTo(candidates[j].args[1].type)) {
                            // Now that we know they work, we'll see if we can set
                            // the prec candidate.
                            if (precScore > lastHighestPrec) {
                                highestPrec = operatorCandidates.length;
                            } else {
                                highestPrec = null;
                            }

                            lastHighestPrec = precScore;

                            operatorCandidates.push({
                                lhsType: lhsTypes[i],
                                rhsType: rhsTypes[k],
                                candidate: candidates[j],
                                precCount: precScore
                            });
                        }
                    }
                }
            }
        }

        // If we have a definite best candidate we'll use it.
        if (highestPrec) {
            const finalCandidate = operatorCandidates[highestPrec];
            lhs.resolve(finalResolver(finalCandidate.lhsType));
            rhs.resolve(finalResolver(finalCandidate.rhsType));
            this.node.reference = finalCandidate.candidate;
            return [new TypeCandidate(finalCandidate.candidate.returnType)];
        } else if (operatorCandidates.length === 0) {
            if (requireType) {
                let overloads = [];

                for (let i = 0; i < lhsTypes.length; i++) {
                    for (let j = 0; j < rhsTypes.length; j++) {
                        overloads.push(
                            `    • static func ${opName}(${lhsTypes[i].candidate}, ${rhsTypes[j].candidate}) -> ${requestedType || '*'}`
                        );
                    }
                }

                this.emit(
                    `No matching candidate for \`${opName}\`. Could not find ` +
                    `overload matching any of:\n${overloads.join("\n")}\n`,
                    e.NO_VALID_OVERLOAD
                );
            } else {
                return [];
            }
        } else {
            // Remove which aren't highest prec
            while (operatorCandidates[0] && operatorCandidates[0].precCount < lastHighestPrec) {
                operatorCandidates.shift();
            }

            if (operatorCandidates.length === 1) {
                const finalCandidate = operatorCandidates[0];
                lhs.resolve(finalResolver(finalCandidate.lhsType));
                rhs.resolve(finalResolver(finalCandidate.rhsType));
                this.node.reference = finalCandidate.candidate;
                return [new TypeCandidate(finalCandidate.candidate.returnType)];
            } else {
                return operatorCandidates.map(
                    operatorCandidate =>
                        new TypeCandidate(operatorCandidate.candidate.returnType)
                );
            }
        }
    }
}
