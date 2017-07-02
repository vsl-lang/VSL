import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * This resolves and mangles a function declaration. This applies to functions
 * and does not support lambdas or such.
 */
export default class RegisterPrimitiveAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Register::PrimitiveAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "primitive") return;
        
        let type = node.args[0];
        let precType = node.args[1] === "_precType";
        tool.context.addPrimitive(type, precType, tool.nthParent(2).scopeRef);
    }
}
