import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import e from '../../errors';

/**
 * Resolves `PropertyExpression`s. Will obtain LHS's type and do a `subscope`
 * lookup. Delegates to `IdResolver` however the scope is the subscope as
 * mentioned before.
 */
export default class PropertyResolver extends TypeResolver {

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
        // We do properties in two steps:
        //  1. Find candidates for LHS
        //  2. Set subscope to LHS.Type
        //  3. Match with RHS using Identifier

        const head = this.node.head;

        // Call to resolve head
        const tailResolver = this.getChild(this.node.tail);

        // The candidates of the head
        const candidates = this.getChild(head).resolve(negotiate);

        // Get requested resolution constraint.
        const requestedResolutionConstraint = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Stores a respective list of candidates in form
        // { headType: TypeCandidate, fieldType: TypeCandidate }
        let candidateList = [];

        // Try IdResolver for each candidate.
        for (let i = 0; i < candidates.length; i++) {
            // Here we will attempt to find if the property exists
            let matchingFields = tailResolver.resolve((type) => {
                switch (type) {
                    case ConstraintType.TypeScope:
                        return candidates[i].candidate.subscope;
                    case ConstraintType.BoundedFunctionContext:
                        return null;
                    default: return negotiate(type);
                }
            });

            // Makes 0 sense if there is more than one returned here. If this is
            // the case we'll just error, maybe post a bug report.
            if (matchingFields.length > 1) {
                throw new TransformationError(
                    `Object has multiple fields with name ${this.node.tail.value}.` +
                    `This is not ordinarially possible, please report a bug ` +
                    `with the code causing this error.`,
                    node
                );
            } else if (matchingFields.length === 1) {
                candidateList.push({
                    headType: candidates[i],
                    aliasItem: this.node.tail.reference,
                    candidate: matchingFields[0]
                });
            } else {
                // If they are no matching fields that means this overload
                // doesn't work.
            }
        }

        if (candidateList.length === 1) {
            this.node.baseRef = candidateList[0].headType.candidate;
            this.node.propertyRef = candidateList[0].aliasItem;
        }

        // TODO: handle these
        return candidateList.map(i => i.candidate);
    }
}
