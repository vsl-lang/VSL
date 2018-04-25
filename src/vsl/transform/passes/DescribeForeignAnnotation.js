import Transformation from '../transformation.js';
import t from '../../parser/nodes';
/**
 * This adds support for @foreign
 */
export default class DescribeForeignAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::ForeignAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "foreign") return;
        tool.nthParent(2).reference.foreignName = node.args[0].toString();
    }
}
