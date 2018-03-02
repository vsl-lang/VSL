import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeForm from '../../scope/scopeForm';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';
import ScopeAliasItem from '../../scope/items/scopeAliasItem';

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
        const scope = this.node.parentScope.scope;
        const rootId = this.node.value;
    }
}
