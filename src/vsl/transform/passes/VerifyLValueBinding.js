import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

import ScopeAliasArgItem from '../../scope/items/scopeAliasArgItem';

/**
 * Verifies LValue is of correct type
 */
export default class VerifyLValueBinding extends Transformation {
    constructor() {
        super(t.AssignmentExpression, "Verify::LValueBinding");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Check that we can actually assign to LHS
        if (node.target.reference instanceof ScopeAliasArgItem) {
            throw new TransformError(
                `Invalid left-hand side of assignment. Function parameters ` +
                `create immutable references.`,
                node.target
            );
        }
    }
}
