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
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return null;

                case ConstraintType.RequireType:
                    return true;

                // Don't simplify that's what we'll do
                case ConstraintType.SimplifyToPrecType:
                    return false;

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

        // Stores the highest prec found.
        let lastHighestPrec = 0;

        // If multiple candidates have `lastHighestPrec`
        let highestPrecIsAmbiguous = false;

        // Last candidate with highest prec
        let highestPrecCandidate = null;

        for (let i = 0; i < lhsTypes.length; i++) {
            const lhsType = lhsTypes[i].candidate.resolved();

            // The operator candidates for this type.
            const candidates = lhsType.staticScope.getAll(opName);

            for (let j = 0; j < candidates.length; j++) {
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

                        // Check if the RHS type works for this operator
                        // candidate. The second arg (.args[1]) refers to the
                        // RHS as the format is +(lhs, rhs)
                        const rhsCandidate = rhsTypes[k].candidate.resolved();
                        if (rhsCandidate.castableTo(candidates[j].args[1].type)) {
                            // Only resolve prec stuff if we are doing prec
                            // simplification.

                            // Now that we know they work, we'll see if we can set
                            // the prec candidate.
                            if (precScore > lastHighestPrec) {
                                lastHighestPrec = precScore;
                                highestPrecIsAmbiguous = false;
                                highestPrecCandidate = candidates[j];
                            } else if (precScore === lastHighestPrec) {
                                highestPrecIsAmbiguous = true;
                            }

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

        if (operatorCandidates.length === 0) {
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
        } else if (operatorCandidates.length === 1) {
            lhs.resolve(finalResolver(operatorCandidates[0].lhsType));
            rhs.resolve(finalResolver(operatorCandidates[0].rhsType));
            this.node.reference = operatorCandidates[0].candidate;
            return [new TypeCandidate(operatorCandidates[0].candidate.returnType)];
        } else if (simplifyToPrecType) {
            // If we have a definite best candidate we'll use it.
            if (lastHighestPrec && !highestPrecIsAmbiguous) {
                return [new TypeCandidate(highestPrecCandidate.returnType)];
            } else {
                let overloads = operatorCandidates
                    .filter(_ => _.precScore === lastHighestPrec)
                    .map(_ => _.candidate)
                    .map(candidate => `    • static func ${opName}(${candidate.args[0].type}, ${candidate.args[1].type}) -> ${candidate.returnType}`)
                    .join('\n');

                this.emit(
                    `Ambiguous binary expression, could not break tie between:\n${overloads}`,
                    e.AMBIGUOUS_EXPRESSION
                );
            }
        } else {
            return operatorCandidates
                .map(_ => _.candidate.returnType)
                .filter((l, i, a) => a.indexOf(l) === i)
                .map(returnType =>
                    new TypeCandidate(returnType));
        }
    }
}
