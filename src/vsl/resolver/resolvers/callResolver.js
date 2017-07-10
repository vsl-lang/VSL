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
        
        // This array is the types which we should set as the
        // RequestedTypeResolutionConstraints
        
        // We know argc <= candidate.args.length
        let typeArgs = new Array(argc).fill([]);
        for (let i = 0; i < candidates.length; i++) {
            let j = 0;
            for (; j < argc; j++) {
                // Check if the arg names match
                if (args[j].name !== candidates[i].args[j].name) {
                    // If they ever don't match we'll pop the types this was
                    // adding and then stop this
                    while (--j >= 0) {
                        typeArgs[j].pop();
                    }
                    
                    // Go onto the next candidate because this one we now know
                    // does not have a matching name
                    break;
                } else {
                    // Since they do match we can add the type to the typeArgs
                    typeArgs[j].push(candidates[i].args[j].type);
                }
            }
        }
        
        console.log(typeArgs);
    }
}
