import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';
/**
 * This validates an external assignment expression such as:
 *
 * ```
 * let x: T external(a);
 * ```
 */
export default class VerifyExternalAssignment extends Transformation {
    constructor() {
        super(t.AssignmentStatement, "Verify::ExternalAssignment");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        if (!(node.value instanceof t.ExternalMarker)) return;

        // First an external assignment must be top-level or is a static var
        if (!node.isGlobal) {
            throw new TransformError(
                `External constant declaration must be either top-level or ` +
                `static.`,
                node
            );
        }

        if (node.type !== t.AssignmentType.Constant) {
            throw new TransformError(
                `External constant declaration must be declared constant.`,
                node
            );
        }
    }
}
