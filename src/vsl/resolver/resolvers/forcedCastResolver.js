import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeMetaClassItem from '../../scope/items/scopeMetaClassItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

import e from '../../errors';

/**
 * Resolves a cast
 */
export default class ForcedCastResolver extends TypeResolver {

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
        // Scope of expression
        const scope = this.node.parentScope.scope;

        // If a deduction is expected
        const requireType = negotiate(ConstraintType.RequireType);

        // Get requested type
        const requestedType = negotiate(ConstraintType.RequestedTypeResolutionConstraint)?.candidate.resolved();

        // Resolve to whatever type
        const valueTy = this.getChild(this.node.value).resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return null;
                case ConstraintType.BoundedFunctionContext:
                    return false;
                case ConstraintType.RequireType:
                case ConstraintType.SimplifyToPrecType:
                    return true;
                case ConstraintType.VoidableContext:
                    return false;
                default: return negotiate(type);
            }
        });

        if (valueTy.length !== 1) {
            this.emit(
                `Undefined state: forced cast expression did not have value type.`
            );
        }

        this.node.valueTy = valueTy[0].candidate;

        // Resolve entire expression as a type.
        const targetTy = new TypeLookup(this.node.target, vslGetTypeChild).resolve(scope);
        this.node.targetTy = targetTy;

        // in `let a: T = b as! U` if `U is T == false` then throw this
        if (requestedType && !targetTy.castableTo(requestedType)) {
            if (requireType) {
                this.emit(
                    `Forced cast expression is to type \`${targetTy}\` which` +
                    `is incompatible with contextual type of ${requestedType}`,
                    e.NO_VALID_TYPE
                );
            } else {
                return [];
            }
        }

        return [new TypeCandidate(targetTy)];
    }
}
