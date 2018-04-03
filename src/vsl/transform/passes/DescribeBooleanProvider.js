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
        if (node.name !== "booleanProvider") return;

        if (tool.context.booleanType !== null) {
            new TransformError(
                `A boolean provider already exists as ${tool.context.booleanType}. ` +
                `only one boolean provider can exist per compilation instance.`,
                node
            );
        } else {
            tool.context.booleanType = tool.nthParent(2).reference;
        }
    }
}
