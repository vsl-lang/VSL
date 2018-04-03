import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import VSLTokenType from '../../parser/vsltokentype';
import e from '../../errors';

function operatorByOne(node, operator) {
    const targetValBase = node.lhs.clone();
    targetValBase.position = node.lhs.position;
    return new t.AssignmentExpression(
        node.lhs,
        new t.BinaryExpression(
            targetValBase,
            node.rhs,
            operator,
            node.position
        ),
        node.position
    );
}

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
                new t.AssignmentExpression(node.lhs, node.rhs, node.position)
            );
            case "+=": return tool.replace(operatorByOne(node, '+'));
            case "-=": return tool.replace(operatorByOne(node, '-'));
            case "*=": return tool.replace(operatorByOne(node, '*'));
            case "/=": return tool.replace(operatorByOne(node, '/'));
            case "%=": return tool.replace(operatorByOne(node, '%'));
            case "&=": return tool.replace(operatorByOne(node, '&'));
            case "^=": return tool.replace(operatorByOne(node, '^'));
            case "|=": return tool.replace(operatorByOne(node, '|'));
            case "**=": return tool.replace(operatorByOne(node, '**'));
        }
    }
}
