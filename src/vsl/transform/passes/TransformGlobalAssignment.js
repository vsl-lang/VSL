import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import e from '../../errors';;

/**
 * This marks global assignments as global.
 */
export default class TransformGlobalAssignment extends Transformation {
    constructor() {
        super(t.AssignmentStatement, "Transform::GlobalAssignment");
    }

    modify(node: Node, tool: ASTTool) {
        node.isGlobal = node.parentScope.rootScope || tool.isStatic;
    }
}
