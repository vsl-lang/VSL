import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';

/**
 * Type deducts if-statements. Requires resolution to a bool type.
 */
export default class TypeDeductIfStatement extends Transformation {
    constructor() {
        super(t.IfStatement, "TypeDeduct::IfStatement");
    }

    modify(node: Node, tool: ASTTool) {
        new RootResolver(node.condition, vslGetChild, tool.context)
            .resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return tool.context.booleanType || null;
                default: return null;
            }
        });
    }
}
