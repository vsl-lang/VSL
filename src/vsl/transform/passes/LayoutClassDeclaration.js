import Transformation from '../transformation';
import TransformError from '../transformError';
import t from '../../parser/nodes';

/**
 * This will layout the fields of a class declaration.
 */
export default class LayoutClassDeclaration extends Transformation {
    constructor() {
        super(t.ClassStatement, "Layout::ClassDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        const scopeItem = node.scopeRef;


    }
}
