import Transformation from '../transformation.js';
import t from '../../parser/nodes';
/**
 * This adds an indefinite typealias to the scope.
 */
export default class DescribeInlineAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::InlineAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "inline") return;
        tool.nthParent(2).reference.shouldInline = true;
    }
}
