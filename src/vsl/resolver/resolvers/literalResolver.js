import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

// import STL from '../../stl/stl';

import VSLTokenType from '../../parser/vsltokentype.js';

/**
 * Resolves any atomic literal described by an `Literal` token class.
 */
export default class LiteralResolver extends TypeResolver {
    
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
        // Get context
        const context = negotiate(ConstraintType.TransformationContext).primitives;

        // Check the requested types of this ID
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        // Check if this has a specific type
        const requiredResolution = negotiate(ConstraintType.ContextParentConstraint)

        // Specify default types for the candidates
        // Perhaps in the future a STL item would have to register or request
        // to be a default candidate but for now they are hardcoded here
        switch (this.node.type) {
            case VSLTokenType.Integer:
                this.node.typeCandidates = context.get("Integer") || [];
                break;
                
            case VSLTokenType.Decimal:
                this.node.typeCandidates = context.get("FloatingPoint") || [];
                break;
                
            case VSLTokenType.String:
                this.node.typeCandidates = context.get("String") || [];
                break;
                
            case VSLTokenType.Regex:
                this.node.typeCandidates = context.get("Regex") || [];
                break;
                
            default: throw new TypeError(`Undeducatble literal of type ${this.node.type}`);
        }
        
        if (response !== null) {
            this.node.typeCandidates = this.node.typeCandidates.filter(::response.includes)
        }

        if (requiredResolution !== null) {
            let res = this.node.typeCandidates.find(candidate => candidate.scopeRef.equal(requiredResolution));
            if (!res) {
                this.emit(
                    `This literal here needs to resolve to something that it ` +
                    `did not resolve to. This error message should probably ` +
                    `be made better.`
                );
            } else {
                this.node.typeCandidates = [res.scopeRef];
                this.node.exprType = res.scopeRef;
            }
        }
        
        if (this.node.typeCandidates.length === 0) {
            this.emit(
                `Literal has no overlapping type candidates. ` + 
                `They are a few reasons this could happen: \n` + 
                `  1. The STL is not linked\n` +
                `  2. You are using a literal which doesn't have a class ` +
                `associated with it.\n` +
                `This is likely an internal bug, but check for an existing` +
                ` report before leaving your own. You can also try to define ` +
                `your own candidate using \`@primitive(...)\``
            );
        }
        
        if (this.node.typeCandidates.length === 1) {
            this.node.exprType = this.node.typeCandidates[0];
        }
    }
}
