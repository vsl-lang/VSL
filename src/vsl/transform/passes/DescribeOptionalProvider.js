import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * Identifiers the provider for optional
 */
export default class DescribeOptionalProvider extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::OptionalProvider");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "optionalType") return;

        if (tool.context.optionalType !== null) {
            throw new TransformError(
                `A optional type already exists as ${tool.context.optionalType}. ` +
                `only one optional type can exist per compilation instance.`,
                node
            );
        } else {
            const optionalType = tool.nthParent(2).reference;

            if (optionalType.genericInfo.parameters.length !== 1) {
                throw new TransformError(
                    `The optional type ${optionalType} should be in the form of ` +
                    `a generic with a single parameter.`,
                    node
                );
            }

            tool.context.optionalType = optionalType;
        }
    }
}
