import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';

const assignmentOperators = [
    "=",
    "+=",
    "-=",
    "*=",
    "/=",
    "&=",
    "%=",
    "**="
]

/**
 * Verifies LValue is of correct type
 */
export default class VerifyLValue extends Transformation {
    constructor() {
        super(t.BinaryExpression, "Verify::LValue");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Only check assignment
        if (!assignmentOperators.includes(node.op)) return;

        const lhs = node.lhs;
        if (!(lhs instanceof t.PropertyExpression || lhs instanceof t.Identifier)) {
            throw new TransformError(
                `Left-hand side of assignment must be property or identifier.`,
                node
            );
        }
    }
}
