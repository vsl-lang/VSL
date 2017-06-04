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
        // Check the requested types of this ID
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);
        
        // Specify default types for the candidates
        // Perhaps in the future a STL item would have to register or request
        // to be a default candidate but for now they are hardcoded here
        switch (this.node.type) {
            case VSLTokenType.Integer:
                // this.node.typeCandidates = [STL.Int, STL.Float, STL.Double]
                break;
                
            case VSLTokenType.Decimal:
                // this.node.typeCandidates = [STL.Float, STL.Double]
                break;
                
            case VSLTokenType.String:
                // this.node.typeCandidates = [STL.String]
                break;
                
            case VSLTokenType.Regex:
                break;
                
            default: throw new TypeError(`Undeducatble literal of type ${this.node.type}`);
        }
        
        if (response !== null) {
            this.node.typeCandidates = this.node.typeCandidates.filter(::response.includes)
        }
        
        if (this.node.typeCandidates.length === 0) {
            this.emit(
                `Literal has no overlapping type candidates. ` + 
                `They are two reasons this could happen: \n` + 
                `  1. The STL is not linked\n` +
                `  2. You are using a literal which doesn't have a class ` +
                `associated with it.\n` +
                `This is likely an internal bug, but check for an existing` +
                ` report before leaving your own.`
            );
        }
        
        if (this.node.typeCandidates.length === 1) {
            this.node.exprType = this.node.typeCandidates[0];
        }
    }
}
