import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import e from '../../errors';;

/**
 * This transforms short-circut expressions to their own nodes.
 */
export default class TransformShortCircut extends Transformation {
    constructor() {
        super(t.BinaryExpression, "Transform::ShortCircut");
    }

    modify(node: Node, tool: ASTTool) {
        switch (node.op) {
            case "||": return tool.replace(
                new t.OrExpression(node.lhs, node.rhs, node.position)
            );

            case "&&": return tool.replace(
                new t.AndExpression(node.lhs, node.rhs, node.position)
            );
        }
    }
}
