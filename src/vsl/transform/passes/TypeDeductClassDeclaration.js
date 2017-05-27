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
        let item = new ScopeTypeItem(
            node.name.identifier.rootId,
            null,
            {
                
            }
        );
        
        node.scopeRef = item;
        
        let res = node.parentScope.scope.set(item);
        if (res === false) throw new TypeError(`Duplicate declaration of classs ${node.identifier.identifier.id}`);
    }
}