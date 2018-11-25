import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import e from '../../errors';

/**
 * Resolves ternary expressions.
 */
export default class TernaryResolver extends TypeResolver {

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
        const condition = this.getChild(this.node.condition);
        const ifTrue = this.getChild(this.node.ifTrue);
        const ifFalse = this.getChild(this.node.ifFalse);

        // If a definite deduction is expected
        const simplifyToPrecType = negotiate(ConstraintType.SimplifyToPrecType);

        // Resolves conditional expressions seperately.
        const context = negotiate(ConstraintType.TransformationContext);
        const booleanType = context.booleanType;
        if (booleanType === null) {
            this.emit(
                `To use a ternary conditional expression, a boolean type must` +
                `be specified. Specify one with @booleanProvider.`
            );
        }

        // The condition should only be one type
        const conditionalTypes = condition.resolve((type) => {
            switch (type) {
                // The child cannot be voidable
                case ConstraintType.VoidableContext: return false;

                // Always boolean for both sides
                case ConstraintType.RequestedTypeResolutionConstraint: return new TypeCandidate(booleanType);

                // Must resolve to a type
                case ConstraintType.SimplifyToPrecType: return true;

                default: return negotiate(type);
            }
        });

        if (conditionalTypes.length !== 1) {
            this.emit(
                `Conditional unexpectedly did not resolve to boolean type.`,
                e.NO_VALID_TYPE
            );
        }

        // Ensure the following resolve correctly
        const ternaryBranchResolver = (type) => {
            switch (type) {
                // The child cannot be voidable
                case ConstraintType.VoidableContext: return false;
                default: return negotiate(type);
            }
        };

        // Resolve both branches
        const trueTypes = ifTrue.resolve(ternaryBranchResolver);
        const falseTypes = ifFalse.resolve(ternaryBranchResolver);

        const typesInCommon = [];

        // Assuming C ? T : F
        for (let i = 0; i < trueTypes.length; i++) {
            let highestWorkingType = null;

            for (let j = 0; j < falseTypes.length; j++) {
                let mostSeniorTypeBetweenBranches;

                // If T extends F
                if (trueTypes[i].candidate.castableTo(falseTypes[j].candidate)) {
                    mostSeniorTypeBetweenBranches = falseTypes[j];
                } else if (falseTypes[i].candidate.castableTo(trueTypes[j].candidate)) {
                    mostSeniorTypeBetweenBranches = trueTypes[i];
                } else {
                    continue;
                }

                if (!highestWorkingType || highestWorkingType.candidate.castableTo(mostSeniorTypeBetweenBranches.candidate)) {
                    highestWorkingType = mostSeniorTypeBetweenBranches;
                }
            }

            if (highestWorkingType) {
                typesInCommon.push(highestWorkingType);
            }
        }

        if (simplifyToPrecType) {
            if (typesInCommon.length === 0) {
                this.emit(
                    `Branches of ternary evaluate to different types:\n` +
                    `  Truthy Branch: ${trueTypes.map(_ => _.candidate.toString()).join(", ")}\n` +
                    `  Falsey Branch: ${falseTypes.map(_ => _.candidate.toString()).join(", ")}\n`
                );
            }

            if (typesInCommon.length > 1) {
                this.emit(
                    `Branches of ternary are ambiguous. Valid types include\n` +
                    typesInCommon.map(_ => `    • ${_.candidate}`).join(`\n`)
                );
            }
        }

        return typesInCommon;
    }
}
