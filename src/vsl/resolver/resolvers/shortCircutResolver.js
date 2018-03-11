import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import e from '../../errors';

/**
 * Resolves binary operator calls. This is NOT an atomic operation. This uses
 * will find the defined static function.
 */
export default class ShhortCircutResolver extends TypeResolver {

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
        const lhs = this.getChild(this.node.lhs);
        const rhs = this.getChild(this.node.rhs);

        // Resolves conditional expressions seperately.
        const context = negotiate(ConstraintType.TransformationContext);
        const booleanType = context.booleanType;
        if (booleanType === null) {
            this.emit(
                `To use a conditional short-circut expression, a boolean ` +
                `type must be specified. Specify one with @booleanProvider.`
            );
        }

        const booleanResolver = (type) => {
            switch (type) {
                // The child cannot be voidable
                case ConstraintType.VoidableContext: return false;

                // Always boolean for both sides
                case ConstraintType.RequestedTypeResolutionConstraint: return new TypeCandidate(booleanType);

                default: return negotiate(type);
            }
        };

        // If these fail resolution they themselves will throw error.
        const lhsTypes = lhs.resolve(booleanResolver);
        const rhsTypes = rhs.resolve(booleanResolver);

        return [new TypeCandidate(booleanType)];
    }
}
