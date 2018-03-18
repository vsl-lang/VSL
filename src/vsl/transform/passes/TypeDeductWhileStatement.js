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
export default class TypeDeductWhileStatement extends Transformation {
    constructor() {
        super(t.WhileStatement, "TypeDeduct::WhileStatement");
    }

    modify(node: Node, tool: ASTTool) {
        if (tool.context.booleanType === null) {
            throw new TransformError(
                `No boolean provider found. This is likely due to the stdlib ` +
                `not being loaded. Declare a class with the @booleanProvider ` +
                `attribute to register it as the boolean provider.`,
                node
            );
        }

        new RootResolver(node.condition, vslGetChild, tool.context)
            .resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return new TypeCandidate(tool.context.booleanType);
                default: return null;
            }
        });
    }
}
