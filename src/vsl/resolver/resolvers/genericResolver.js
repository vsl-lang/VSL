import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeMetaClassItem from '../../scope/items/scopeMetaClassItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

import e from '../../errors';

/**
 * Resolves `Generic` in properties.
 */
export default class GenericResolver extends TypeResolver {

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


        // Resolve entire expression as a type.
        const type = new TypeLookup(this.node, vslGetTypeChild).resolve(scope);
        this.node.reference = type;

        const isCallee = negotiate(ConstraintType.BoundedFunctionContext);

        if (isCallee) {
            return [type];
        }


        // Now that we have the type, we can return it as a metaclass
        return [
            new TypeCandidate(
                new ScopeMetaClassItem({
                    referencingClass: type
                })
            )
        ];
    }
}
