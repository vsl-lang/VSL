import Transformation from '../transformation';
import t from '../../parser/nodes';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';

/**
 * A pre-processing assignment value. So for `var x = a`. This will register
 * x as a type. Candidates will not be registered, that happens in the
 * transformer.
 */
export default class DescribeVariableAssignment extends Transformation {
    constructor() {
        super(t.AssignmentStatement, "Describe::VariableAssignment");
    }
    
    modify(node: Node, tool: ASTTool) {
        // Quite a mouth full but explanation:
        // Node (AssignmentStatement) -> TypedIdentifier -> Identifier -> ScopeItem -> String
        let rootId = node.identifier.identifier.identifier.rootId;
        
        let scope = node.parentScope.scope;
        
        // Resolve the type if applicable
        let candidates = [];
        if (node.identifier.type !== null) {
            tool.queueThenDeep(node.identifier.type, node.identifier, 'type', null);
            let type = node.identifier.type;
            
            if (!(type instanceof t.Identifier)) {
                throw new TypeError(`Did not reduce type, ${node.identifier}, to ID`);
            }
            
            let lookupId = type.identifier.rootId;
            // Locate type
            let candidate = scope.get(new ScopeTypeItem(lookupId));
            
            if (candidate === null) candidates.push(lookupId);
            else candidates.push(candidate);
        }
        
        let ref = new ScopeAliasItem(
            rootId,
            candidates
        );
        scope.set(ref);
    }
}