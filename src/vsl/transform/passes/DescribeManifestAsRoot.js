import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * Identifiers the provider for static enum backing type.
 */
export default class DescribeManifestAsRoot extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::ManifestAsRoot");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "manifestAsRoot") return;
    }
}
