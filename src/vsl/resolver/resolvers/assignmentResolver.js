import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import e from '../../errors';

/**
 * Resolves assignments such as `a = 1`
 */
export default class AssignmentResolver extends TypeResolver {

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
        const target = this.getChild(this.node.target);
        const value = this.getChild(this.node.value);

        // Resolves conditional expressions seperately.
        const resultType = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Get the type that the assignment is.
        const [ targetType ] = target.resolve((type) => {
            switch (type) {
                case ConstraintType.VoidableContext: return false;
                case ConstraintType.RequestedTypeResolutionConstraint: return null;
                default: return negotiate(type);
            }
        });

        if (resultType && !targetType.castableTo(resultType)) {
            this.emit(
                `Assignment must resolve to ${resultType} in this context ` +
                `however is of type ${targetType}.`
            );
        }

        const valueTypes = value.resolve((type) => {
            switch (type) {
                case ConstraintType.VoidableContext: return false;
                case ConstraintType.RequestedTypeResolutionConstraint: return targetType;
                default: return negotiate(type);
            }
        });

        if (valueTypes.length === 1) {
            this.node.reference = targetType;
        } else if (rhsTypes.length === 0) {
            this.emit(
                `Assignment target is of ${targetType} however the value ` +
                `could not be interpreted as this.`
            );
        }

        return [new TypeCandidate(targetType)];
    }
}
