import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/**
 * Passes (i.e. prevents) a certain check or validation pass from running.
 */
export default class RegisterPassAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Register::PassAnnotation");
    }

    modify(node: Node, tool: ASTTool) {
        // Check that it's the correct type
        if (node.name !== "pass") return;
        let passName = node.args[0];
        let func = node.nthParent(2);
        
        switch(passName) {
            case "return":
                func.validateReturn = false;
            default:
                break;
        }
    }
}
