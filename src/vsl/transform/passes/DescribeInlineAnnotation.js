import Transformation from '../transformation';
import TransformError from '../transformError';
import t from '../../parser/nodes';

const INLINE_ANNOTATION_PARAM_VALUES = ["hint", "always"];

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
        if (node.args[0] && !INLINE_ANNOTATION_PARAM_VALUES.includes(node.args[0])) {
            throw new TransformError(
                `Parameter for @inline annotation must be ${
                    INLINE_ANNOTATION_PARAM_VALUES
                        .map(value => `\`${value}\``)
                        .join(" or ")
                }`,
                node
            );
        }

        const functionReference = tool.nthParent(2).reference;
        functionReference.shouldInline = true;
        functionReference.shouldForceInline = node.args[0] === "always";
    }
}
