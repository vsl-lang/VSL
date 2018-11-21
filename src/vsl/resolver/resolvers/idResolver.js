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
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';

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

        const typeContext = negotiate(ConstraintType.TypeContext);

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
            return results
                .map(result => {
                    // If it is a class we MUST wrap it as a metaclass.
                    if (result instanceof ScopeTypeItem) {
                        return this.wrapType(result);
                    } else {
                        return result;
                    }
                })
                .map(item => new TypeCandidate(item));
        }

        let resultType;

        if (results.length > 1) {
            this.emit(`Ambiguous reference to variable ${rootId}`);
        }

        const result = results[0];

        // Get the WHAT the identifier is (result)
        if (result instanceof ScopeTypeItem) {
            // If it's a metaclass.
            resultType = this.wrapType(result);
        } else if (result) {
            // This is what all other results SHOULD be. Anything else is an
            // unexpected return for an identifier
            //
            // Typical identifiers (i.e. variables) fall here
            resultType = result.type;
        } else {
            // Unexpected result type— this is an internal error.
            const ty = result?.constructor?.name || result;
            this.emit(
                `Unexpected error of type ${ty}`
            );
        }

        // Negotiate the requested type for this identifier.
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Resolve the result type
        resultType.resolve();

        // Get the type in context
        resultType = resultType.contextualType(typeContext);

        // Check if the given ID does actually have type (response).
        if (response && !resultType.castableTo(response.candidate)) {
            return [];
            // this.emit(
            //     `Use of ${rootId} has no types which it can be deducted to\n` +
            //     `in this context. This means the variable is one type but for ` +
            //     `everything to work it would need to be a different type.`,
            //     e.CANNOT_RESOLVE_IDENTIFIER
            // );
        }

        this.node.reference = result;

        return [new TypeCandidate(resultType)];
    }

    /**
     * Wraps a type into a metaclass.
     * @param {ScopeTypeItem} result - A normal type item to wrap as a metaclass.
     * @protected
     * @return {ScopeMetaClassItem}
     */
    wrapType(result) {
        // Generics would be resolved using TypeResolver so if we see one
        // here that means it was not specialized

        if (result.isGeneric) {
            this.emit(
                `Cannot use generic ${result.rootId} class without specifying ` +
                `parameter types using \`${result.rootId}<...>\``,
                e.GENERIC_SPECIALIZATION_REQUIRED
            );
        }

        // If the identifier returns a 'Type' i.e. a class was directly
        // references we'll return a 'MetaType' wrapper
        return new ScopeMetaClassItem({
            referencingClass: result
        });
    }
}
