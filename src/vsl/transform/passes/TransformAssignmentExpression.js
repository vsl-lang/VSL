import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import e from '../../errors';;

/**
 * This transforms assignment expressions to their own nodes.
 */
export default class TransformAssignmentExpression extends Transformation {
    constructor() {
        super(t.BinaryExpression, "Transform::AssignmentExpression");
    }

    modify(node: Node, tool: ASTTool) {
        switch (node.op) {
            case "=": return tool.replace(
                new t.AssignmentExpression(node.lhs, node.rhs, '', node.position)
            );
        }
    }
}
