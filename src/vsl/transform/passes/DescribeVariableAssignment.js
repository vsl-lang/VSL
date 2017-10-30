import Transformation from '../transformation';
import t from '../../parser/nodes';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';

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
        let variableName = node.name.identifier.value;
        let variableType = node.name.type;
        
        let expression = node.value;
        let scope = node.parentScope.scope;
        
        // Resolve the given type if it exists.
        if (variableType !== null) {
            node.expectedType = new TypeLookup(variableType, vslGetTypeChild)
                .resolve(scope);
        }
        
        scope.set(
            new ScopeAliasItem(
                variableName,
                node
            )
        )
    }
}
