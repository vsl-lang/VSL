import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

/**
 * Type deducts while-statements. Requires resolution to a bool type.
 */
export default class TypeDeductInitDelegation extends Transformation {
    constructor() {
        super(t.InitDelegationCall, "TypeDeduct::InitDelegation");
    }

    modify(node: Node, tool: ASTTool) {
        new RootResolver(node.condition, vslGetChild, tool.context)
            .resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return new TypeCandidate(tool.context.booleanType);
                case ConstraintType.RequireType:
                case ConstraintType.SimplifyToPrecType:
                    return true;
                default: return null;
            }
        });
    }
}
