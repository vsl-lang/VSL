import TypeDeductAssignment from './TypeDeductAssignment';
import t from '../../parser/nodes';

/**
 * Type deducts fields and adds them to type layout.
 */
export default class TypeDeductField extends TypeDeductAssignment {
    constructor() {
        super(t.FieldStatement, "TypeDeduct::FieldStatement");
    }

    /** @override */
    isValidNode(node) { return node instanceof t.FieldStatement }

    modify(node: Node, tool: ASTTool) {
        super.modify(node, tool);
    }
}
