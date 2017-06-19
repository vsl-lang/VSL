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
            // Transform the type to mangle it et al.
            tool.queueThenDeep(node.identifier.type, node.identifier, 'type', null);
            let type = node.identifier.type;
            
            // The mangler will wrap and identifier with a rough ScopeItem so
            // just check everything worked.
            if (!(type instanceof t.Identifier)) {
                throw new TypeError(`Did not reduce type, ${node.identifier}, to ID`);
            }
            
            let lookupId = type.identifier.rootId;
            
            // Obtain the type's object from its name
            let candidate = scope.get(new ScopeTypeItem(lookupId));
            
            // If we couldn't find it pass it as a string for resolution later.
            if (candidate === null) candidates.push(lookupId);
            else candidates.push(candidate);
        }
        
        node.ref = new ScopeAliasItem(
            rootId,
            candidates,
            node
        );
        scope.set(node.ref);
    }
}
