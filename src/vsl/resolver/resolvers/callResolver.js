import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

import ScopeFuncItem from '../../scope/items/scopeFuncItem';

/**
 * Resolves and chooses the correct function to call of the head. This is  NOT
 * an atomic resolution
 */
export default class CallResolver extends TypeResolver {

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
        const args = this.node.arguments;
        const argc = this.node.arguments.length;

        // Negotiate the requested type for this identifier.
        let head = this.getChild(this.node.head);
        head.resolve((type) => {
            switch (type) {
                // This basically says we want a function in return
                // This will return ALL of the function with the rootId
                // So we'll filter candidates here.
                case ConstraintType.BoundedFunctionContext: return argc;

                // Propogate negotation as this only handles the one
                default: return negotiate(type);
            }
        });

        // Generate the arg object and we'll ref that for lookup
        // The types of these children are not yet known so we'll need to narrow
        // them down as best as we can and use those as the candidates
        const candidates = this.node.head.typeCandidates;

        let validCandidates = [];

        // This array is the types which we should set as the
        // RequestedTypeResolutionConstraints
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].args.length !== argc) continue;

        }
    }
}
