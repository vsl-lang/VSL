import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeForm from '../../scope/scopeForm';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';
import ScopeAliasItem from '../../scope/items/scopeAliasItem';

import e from '../../errors';

/**
 * Resolves `Idenifier`s in terms of type and declaration. This will do a lookup
 * but also check for valid candidates in terms of further chaining. This may
 * resolve to a TypeItem or an AliasItem.
 */
export default class IdResolver extends TypeResolver {

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
        const scope = this.node.parentScope.scope;
        const rootId = this.node.value;

        // If passed callArgs we know it's a fucntion
        // that is the number of args so we can use this as a basic filter to
        // narrow down candidates
        const callArgs = negotiate(ConstraintType.BoundedFunctionContext);
        if (callArgs !== null) {
            // All we need to do here is just to get all function with the
            // rootId and set those as the candidates. In any case we'll call
            // ambiguity if unresolved

            // We can omit void functions in this filter if it specified that
            // they aren't need
            const allowVoid = negotiate(ConstraintType.VoidableContext);
            const bindingContext = negotiate(ConstraintType.BindingContext);

            // Basic filter which removed candidates which aren't either funcs
            // or have less arguments than called with,
            let candidates = (
                scope.getAll(rootId)
                    .filter(item =>
                        item instanceof ScopeFuncItem &&
                        item.args.length === callArgs
                    )
            );

            // If they are 0 candidates that means there is no function which
            // actually has the name
            if (candidates.length === 0) {
                this.emit(
                    `Use of undeclared function \`${rootId}\``,
                    e.UNDECLARED_FUNCTION
                )
            }

            // If there is one candidate we'll set this reference. Otherwise
            // we'll have to redo it. If this is `null` in backend an error
            // should be thrown.
            if (candidates.length === 1) {
                this.reference = candidates[0];
            }

            // Return candidates for parent function to handle.
            return candidates;
        }

        // Negotiate the requested type for this identifier.
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Get the variable this references
        // Pass this.node so we can know that this node referenced the
        // variable we are trying to get.
        let result = scope.getAsDelegate(
            new ScopeAliasItem(ScopeForm.query, rootId),
            this.node
        );

        if (!result) {
            this.emit(
                `Use of undeclared identifier ${rootId}. If you wanted to ` +
                `reference a function, make sure you specify a function type ` +
                `somewhere.`,
                e.UNDECLARED_IDENTIFIER
            );
        }

        // And this sets the candidates to the same one the ID had
        const typeCandidates = [ new TypeCandidate(result.type) ];

        // Filter amongst response
        this.mutableIntersect(response, typeCandidates);

        if (typeCandidates.length === 0) {
            this.emit(
                `Use of ${rootId} has no types which it can be deducted to\n` +
                `in this context. This means the variable is one type but  ` +
                `everything to work it would need to be a different type.`,
                e.CANNOT_RESOLVE_IDENTIFIER
            );
        }

        if (typeCandidates.length === 1) {
            this.node.reference = result;
        }

        return typeCandidates;
    }
}
