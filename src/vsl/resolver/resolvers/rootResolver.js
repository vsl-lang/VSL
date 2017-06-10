import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

/**
 * Resolves `ExpressionStatement`s at the top level. This class only takes in a
 * single `ContextParentConstraint`. For functions this would probably needed to
 * be propogated to take into scope and resolve which function prototypes fit
 * the bill.
 * 
 * Call this if you have an expression you want to resolve and DO NOT FORGET
 * to specify a negotiator. Make sure your negotiator is damn good for best
 * results.
 */
export default class RootResolver extends TypeResolver {
    
    /**
     * @param {Node} node - The node to resolve.
     * @param {function(from: Node): TypeResolver} getChild - Takes a node and
     *     returns the resolver to execute, it is reccomended to just use a
     *     `switch` statement with `from.constructor` and then use that. It is
     *     fine to throw if the node is unhandled.
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver,
        context: ?TransformationContext
    ) {
        super(node, getChild);
        this.context = context;
    }
    
    /**
     * Resolves types for a given node.
     * 
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     */

    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        // Attempt to obtain any context-clues/types
        // example: `var a: T = b`
        // `b` is an ExpressionStatement, `T` is what this would give
        const response = negotiate(ConstraintType.ContextParentConstraint);
        const negotiator = (type) => {
            switch (type) {
                case ConstraintType.ContextParentConstraint: return response;
                case ConstraintType.TransformationContext: return this.context;
                default: return null;
            }
        };
        
        const child = this.getChild(this.node.expression);
        child.resolve(negotiator);
        
        this.node.typeCandidates = this.node.expression.typeCandidates;
        this.node.exprType = this.node.expression.exprType;
    }
}
