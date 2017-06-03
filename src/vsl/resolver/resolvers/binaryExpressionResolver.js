import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeAliasItem from '../../scope/items/scopeAliasItem';

/**
 * Resolves types of a binary expression. Checks for candidates on LHS and does
 * a 
 */
export default class BinaryExpressionResolver extends TypeResolver {
    
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
        // Negotiate the requested type for this identifier.
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);
        
        let result = this.node.parentScope.scope.get(
            new ScopeAliasItem(this.node.identifier.rootId)
        );
        
        if (result === null)
            throw new Error(`Use of undeclared identifier ${this.node.identifier.rootId}`);
        
        // Candidates of type
        let candidates = result.candidates;
        
        // Atomic type so no further requeuing
    }
}