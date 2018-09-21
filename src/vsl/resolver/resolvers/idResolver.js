import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';
import ScopeAliasItem from '../../scope/items/scopeAliasItem';
import ScopeGenericItem from '../../scope/items/scopeGenericItem';
import ScopeMetaClassItem from '../../scope/items/scopeMetaClassItem';
import TemplateSpecialization from '../../scope/items/TemplateSpecialization';

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
        const scope = negotiate(ConstraintType.TypeScope);
        const rootId = this.node.value;

        // Get the variable this references
        // Pass this.node so we can know that this node referenced the
        // variable we are trying to get.
        let results = scope.getAll(rootId);

        if (results.length === 0) {
            this.emit(
                `Use of undeclared identifier ${rootId}. If you wanted to ` +
                `reference a function, make sure you specify a function type ` +
                `somewhere.`,
                e.UNDECLARED_IDENTIFIER
            );
        }

        // If passed callArgs we know it's a fucntion
        // that is the number of args so we can use this as a basic filter to
        // narrow down candidates
        const callArgs = negotiate(ConstraintType.BoundedFunctionContext);
        if (callArgs) {
            // Return candidates for parent function to handle.
            return results;
        }

        let resultType;

        if (results.length > 1) {
            this.emit(`Ambiguous reference to variable ${rootId}`);
        }

        const result = results[0];

        // Get result type
        if (result instanceof ScopeTypeItem) {
            resultType = new ScopeMetaClassItem({
                referencingClass: result
            });
        } else if (result instanceof ScopeGenericItem) {
            this.emit(
                `Cannot use generic ${result.rootId} class without specifying ` +
                `parameter types using \`${result.rootId}<...>\``
            );
        } else if (result instanceof TemplateSpecialization) {
            this.emit(
                `Cannot use generic parameter ${result.rootId} in an expression. ` +
                `Only usable in type expressions.`
            );
        } else if (result) {
            resultType = result.type;
        } else {
            const ty = result?.constructor?.name || result;
            this.emit(
                `Unexpected error of type ${ty}`
            );
        }

        // Negotiate the requested type for this identifier.
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // And this sets the candidates to the same one the ID had
        const typeCandidates = [ new TypeCandidate(resultType.resolved()) ];

        // Filter amongst response
        if (response) {
            this.mutableIntersect([response], typeCandidates);
        }

        if (typeCandidates.length === 0) {
            this.emit(
                `Use of ${rootId} has no types which it can be deducted to\n` +
                `in this context. This means the variable is one type but for ` +
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
