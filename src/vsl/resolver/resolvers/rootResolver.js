import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeResolver from '../typeResolver';
import TypeContext from '../../scope/TypeContext';

import e from '../../errors';

/**
 * Resolves `ExpressionStatement`s at the top level. This class takes in a
 * `TransformationContext` for primitive identification. For functions this
 * would probably needed to be propogated to take into scope and resolve which
 * function prototypes fit the bill.
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
     * @param {?TransformationContext} context - The transformation context from
     *     which this is being called. if this is not being called by a
     *     transformer you can use that was used on the transformer which
     *     processed the STL. This is used for linking primitives with classes.
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
        const negotiator = (type) => {
            switch (type) {
                case ConstraintType.TypeScope: return this.node.parentScope.scope;
                case ConstraintType.TransformationContext: return this.context || negotiate(type);
                case ConstraintType.SimplifyToPrecType: return negotiate(type);
                case ConstraintType.TypeContext: return TypeContext.empty();
                default: return negotiate(type);
            }
        };

        const child = this.getChild(this.node.expression);
        let result = child.resolve(negotiator);

        if (negotiate(ConstraintType.SimplifyToPrecType) === true) {
            // We are here if this resolver is supposed to find the 'precTypes'.
            // E.g. in `let a = 3`. `3` can be all different types of integers
            // This will pick `Int32` as a default

            // If we have 1 result we are good
            if (result.length === 1) return result;
            if (result.length === 0) {
                this.emit(
                    `Expression has no valid type.`,
                    e.NO_VALID_TYPE
                );
            }

            let precCandidate = null;
            for (let i = 0; i < result.length; i++) {
                if (result[i].precType) {
                    if (precCandidate !== null) {
                        this.emit(
                            `Expression is ambiguous. Additionally multiple ` +
                            `precedence candidates found.`,
                            e.AMBIGUOUS_EXPRESSION
                        );
                    } else {
                        precCandidate = result[i];
                    }
                }
            }

            if (precCandidate === null) {
                this.emit(
                    `Expression is ambiguous.`,
                    e.AMBIGUOUS_EXPRESSION
                );
            }

            child.resolve((type) => {
                switch (type) {
                    case ConstraintType.RequestedTypeResolutionConstraint:
                        return precCandidate;
                    default: return negotiator(type);
                }
            });

            result = [precCandidate];
        }

        return result;
    }
}
