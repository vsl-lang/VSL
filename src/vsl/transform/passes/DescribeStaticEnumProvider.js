import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * Identifiers the provider for static enum backing type.
 */
export default class DescribeStaticEnumProvider extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::StaticEnumProvider");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "staticEnumProvider") return;

        if (tool.context.staticEnumerationType !== null) {
            new TransformError(
                `A static enum provider already exists as ` +
                `${tool.context.staticEnumerationType} only one boolean ` +
                `provider can exist per compilation instance.`,
                node
            );
        } else {
            tool.context.staticEnumerationType = tool.nthParent(2).reference;
        }
    }
}
