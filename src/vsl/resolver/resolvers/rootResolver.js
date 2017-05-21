import ConstaintType from '../constaintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';

/**
 * Resolves `ExpressionStatement`s at the top level. This class only takes in a
 * single `ContextParentConstraint`. For functions this would probably needed to
 * be propogated to take into scope and resolve which function prototypes fit
 * the bill.
 */
export default class RootResolver extends TypeResolver {
    
    /**
     * @param {function(offer: ConstraintType): ?TypeConstaint} negotiator - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver
    ) {
        super(node, getChild);
    }
    
    /** @override */
    resolve(negotiator: (ConstraintType) => ?TypeConstraint) {
        // Attempt to obtain any context-clues/types
        // example: `var a: T = b`
        // `b` is an ExpressionStatement, `T` is what this would give
        const response = negotiator(ConstraintType.ContextParentConstraint);
        const negotiator = (type) => {
            if (type === ConstraintType.ContextParentConstraint) return response;
            else return null;
        };
        
        const child = this.getChild(this.node.expression, negotiator);
        child.resolve(negotiator);
    }
}