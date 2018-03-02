import Transformation from '../transformation';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * This will handle the `mock` declaration on a `class`.
 */
export default class DescribeTypeMockAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Register::TypeMockAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct annotation
        if (node.name !== "mock") return;
        let classDecl = tool.nthParent(2);
        classDecl.scopeRef.mockType = node.args[0];
    }
}
