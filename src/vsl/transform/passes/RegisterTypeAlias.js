import Transformation from '../transformation';
import t from '../../parser/nodes';

/**
 * This resolves a type alias if not already.
 */
export default class RegisterTypeAlias extends Transformation {
    constructor() {
        super(t.TypeAlias, "Register::TypeAlias");
    }

    modify(node: Node, tool: ASTTool) {
        node.reference.resolve();
    }
}
