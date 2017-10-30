import Transformation from '../transformation';
import t from '../../parser/nodes';

import TransformError from '../transformError';
import e from '../../errors';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';
import ScopeForm from '../../scope/scopeForm';

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
        
        let result = scope.set(
            new ScopeAliasItem(
                ScopeForm.definite,
                variableName,
                node
            )
        );
        
        if (result === false) {
            throw new TransformError(
                `Redeclaration of variable \`${variableName}\` in scope. Did ` +
                `you mean to use the assignment operator (\`=\`)?`,
                node.name.identifier,
                e.DUPLICATE_DECLARATION
            );
        }
    }
}
