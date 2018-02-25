import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';
import e from '../../errors';

/**
 * This handles `@dynamic(false)` annotation.
 */
export default class DescribeDynamicAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Register::TypeMockAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct annotation
        if (node.name !== "dynamic") return;

        const value = node.args[0];
        if (typeof value !== "boolean") {
            throw new TransformError(
                `\`@dynamic\` parameter must be boolean.`,
                node, e.INVALID_DYNAMIC_NODE
            );
        }

        let classDecl = tool.nthParent(2);
        classDecl.scopeRef.dynamicDispatch = value;
    }
}
