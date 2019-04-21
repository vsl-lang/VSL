import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * Identifiers the provider for booleans such as in `if`s.
 */
export default class DescribeBooleanProvider extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::BooleanProvider");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "booleanType") return;

        if (tool.context.booleanType !== null) {
            new TransformError(
                `A boolean type already exists as ${tool.context.booleanType}. ` +
                `only one boolean type can exist per compilation instance.`,
                node
            );
        } else {
            tool.context.booleanType = tool.nthParent(2).reference;
        }
    }
}
