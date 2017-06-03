import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeAliasItem from '../../scope/items/scopeAliasItem';

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
        // If specified, the type MUST resolve to this type.
        const required = negotiate(ConstraintType.ContextParentConstraint);
        
        // Negotiate the requested type for this identifier.
        // This is supplied if they are multiple candidiates which this can fullfill
        const candidates = negotiate(ConstraintType.RequestedTypeResolutionConstraint);
        
        let result = this.node.parentScope.scope.get(
            new ScopeAliasItem(this.node.identifier.rootId)
        );
        
        if (result === null)
            throw new Error(`Use of undeclared identifier ${this.node.identifier.rootId}`);
        
        // Candidates of type
        let candidates = result.candidates;
        
        if (required !== null) {
            // Check if the type matches the required type.
        } else if (candidates !== null) {
            
        } else {
            // This should just inherit the resolution type or throw an error if
            // we can't figure it out
        }
    }
}