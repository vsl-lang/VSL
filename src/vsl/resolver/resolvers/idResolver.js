import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';

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
        const rootId = this.node.identifier.rootId;
        
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
            
            // Basic filter which removed candidates which aren't either funcs
            // or have less arguments than called with,
            this.node.typeCandidates = scope
                .getAll(rootId)
                .filter(
                    candidate =>
                        candidate instanceof ScopeFuncItem &&
                        callArgs <= candidate.args.length
                );
            
            // If they are 0 candidates that means there is no function which
            // actually has the name
            if (this.node.typeCandidates.length === 0) {
                this.emit(
                    `Use of undeclared function ${rootId}`,
                    e.UNDECLARED_FUNCTION
                )
            }
                
            return;
        }
        
        // Negotiate the requested type for this identifier.
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);
        
        let result = scope.get(
            new ScopeAliasItem(rootId)
        );
        
        if (!result) {
            this.emit(
                `Use of undeclared identifier ${rootId}. If you wanted to ` +
                `reference a function, make sure you specify a function type ` +
                `somewhere.`,
                e.UNDECLARED_IDENTIFIER
            );
        }
        
        // Atomic type so no further requeuing
        // This marks a reference that this node ref'd the ID
        result.references.push(this.node);
        
        // And this sets the candidates to the same one the ID had
        this.node.typeCandidates = result.candidates;
        
        // Filter amongst response
        this.mutableIntersect(response, this.node.typeCandidates);
        
        if (this.node.typeCandidates.length === 0) {
            this.emit(
                `Use of ${rootId} has no types which it can be deducted to\n` +
                `in this context. This is likely an internal bug as this\n` +
                `means that the identifier refers to a variable which\n` +
                `already has no valid type candidates.`,
                e.CANNOT_RESOLVE_IDENTIFIER
            );
        }
    }
}
