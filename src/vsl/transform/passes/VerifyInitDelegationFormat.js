import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

/**
 * Verifies `self.init()` and `super.init()` are where they are supposed to be.
 */
export default class VerifyInitDelegationFormat extends Transformation {
    constructor() {
        super(t.InitDelegationCall, "Verify::InitDelegationFormat");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Only apply for code block inits
        // It doesn't make sense to apply for native inits for example.
        if (!(node.statements instanceof t.CodeBlock)) return;

        if (tool.nthParent(2) instanceof t.InitializerStatement) {
            return;
        } else {
            throw new TransformError(
                'Delegating initalizers must be top-level in initializer.',
                node
            )
        }
    }
}
