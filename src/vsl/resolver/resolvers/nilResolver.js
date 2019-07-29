import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';

import VSLTokenType from '../../parser/vsltokentype.js';

import e from '../../errors';

/**
 * Resolves a `nil` statement in context
 */
export default class NilResolver extends TypeResolver {

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
        // Get the optional
        const contextualOptionalType = negotiate(ConstraintType.TransformationContext).optionalType;

        // Check the requested types of this ID
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Check if this must resolve
        const requireType = negotiate(ConstraintType.RequireType);

        if (!response) {
            if (requireType) {
                this.emit(
                    `In this context, no contextual type found to which \`nil\`` +
                    `should be resolved to.`
                );
            } else {
                return [];
            }
        }

        const targetOptionalType = response.candidate;

        if (!(
            targetOptionalType instanceof ScopeGenericSpecialization &&
            targetOptionalType.genericClass === contextualOptionalType
        )) {
            if (requireType) {
                this.emit(
                    `Contextual type for \`nil\` type must be an optional type ` +
                    `but instead is ${targetOptionalType}.`
                );
            } else {
                return [];
            }
        }

        this.node.reference = response.candidate;

        return [response];
    }
}
