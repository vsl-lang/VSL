import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

/**
 * Verifies LValue is of correct type
 */
export default class VerifyLValue extends Transformation {
    constructor() {
        super(t.AssignmentExpression, "Verify::LValue");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        const target = node.target;
        if (!(target instanceof t.PropertyExpression || target instanceof t.Identifier)) {
            throw new TransformError(
                `Left-hand side of assignment must be property or identifier.`,
                node.target
            );
        }
    }
}
