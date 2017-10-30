import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import ScopeTypeItem from '../../scope/items/scopeTypeItem';

/**
 * Assigns and expands class declarations.
 */
export default class TypeDeductClassDeclaration extends Transformation {
    constructor() {
        super(t.ClassStatement, "TypeDeduct::ClassDeclaration");
    }
    
    modify(node: Node, tool: ASTTool) {
        // TODO:
    }
}
