import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';

/**
 * Type deducts top-level expressions. Does not handle expressions within
 * contexts or such. This means this can allow void functions etc.
 *
 * @example
 * f$RVoid()
 */
export default class TypeDeductExpression extends Transformation {
    constructor() {
        super(t.ExpressionStatement, "TypeDeduct::Expression");
    }

    modify(node: Node, tool: ASTTool) {
        // Ensure top-level expression
        if (tool.nthParent(2) !== node.parentScope) return;

        new RootResolver(node, vslGetChild, tool.context)
            .resolve((type) => {
            switch (type) {
                case ConstraintType.RequireType:
                case ConstraintType.SimplifyToPrecType: return true;
                case ConstraintType.VoidableContext: return true;
                default: return null;
            }
        });
    }
}
