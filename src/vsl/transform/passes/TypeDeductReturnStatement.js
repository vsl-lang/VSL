import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

/**
 * Type deducts top-level expressions. Does not handle expressions within
 * contexts or such. This means this can allow void functions etc.
 *
 * @example
 * f$RVoid()
 */
export default class TypeDeductReturnStatement extends Transformation {
    constructor() {
        super(t.ReturnStatement, "TypeDeduct::ReturnStatement");
    }

    modify(node: Node, tool: ASTTool) {
        new RootResolver(node.expression, vslGetChild, tool.context)
            .resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return node.expectedReturnType && new TypeCandidate(node.expectedReturnType);
                case ConstraintType.RequireType:
                case ConstraintType.SimplifyToPrecType:
                    return true;
                default: return null;
            }
        });
    }
}
