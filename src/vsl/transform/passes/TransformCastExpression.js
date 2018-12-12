import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import e from '../../errors';

/**
 * This transforms cast expressions to their own nodes.
 */
export default class TransformCastExpression extends Transformation {
    constructor() {
        super(t.BinaryExpression, "Transform::CastExpression");
    }

    modify(node: Node, tool: ASTTool) {
        switch (node.op) {
            case "::": return tool.replace(
                new t.BitcastExpression(node.lhs, node.rhs, node.position)
            );

            case "as": return tool.replace(
                new t.CastExpression(node.lhs, node.rhs, node.position)
            );
        }
    }
}
