import TypeDeductAssignment from './TypeDeductAssignment';
import t from '../../parser/nodes';

/**
 * Type deducts globals
 */
export default class TypeDeductGlobal extends TypeDeductAssignment {
    constructor() {
        super(t.AssignmentStatement, "TypeDeduct::Global");
    }

    /** @override */
    isValidNode(node) {
        return node.parentScope.rootScope;
    }

    modify(node: Node, tool: ASTTool) {
        super.modify(node, tool);
    }
}
