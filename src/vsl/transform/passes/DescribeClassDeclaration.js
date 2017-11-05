import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeGenericItem from '../../scope/items/scopeGenericItem';

/**
 * A pre-processing entry for a class declaration. This goes top-down and
 * "registers" or adds the class to a global table of all items for at least
 * that scope.
 */
export default class DescribeClassDeclaration extends Transformation {
    constructor() {
        super(t.ClassStatement, "Describe::ClassDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        let className = node.name.value;
        let type;
        
        let opts = {
            subscope: node.statements.scope,
            isInterface: false
        };
        
        if (node.generics.length === 0) {
        
            type = new ScopeTypeItem(
                ScopeForm.definite,
                className,
                opts
            );
            
        } else {
            
            type = new ScopeGenericItem(
                ScopeForm.definite,
                className,
                {
                    genericParents: node.generics.map(_ => ScopeTypeItem.RootClass),
                    ...opts
                }
            );
            
        }

        if (scope.set(type) === false) {
            throw new TransformError(
                `Duplicate declaration of class ${className}. In this scope ` +
                `there is already another class with that name.`,
                node, e.DUPLICATE_DECLARATION
            );
        } else {
            node.scopeRef = type;
        }
    }
}
