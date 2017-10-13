import Transformation from '../transformation';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';

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
        // Scope class is in
        let scope = node.parentScope.scope;
        
        // Class name
        let rootId = node.name.identifier.rootId;

        // Okay do a lookup for these
        let parentRefs = node.superclasses;
        let parents = [];
        
        let options = {
            subscope: node.statements.scope,
            isInterface: false
        };

        // Resolve the superclasses/super-interfaces
        options.supertypes = parentRefs?.map((_, i) => {
            // Transform the children (i.e. resolve paths)
            tool.queueThenDeep(parentRefs[i], parentRefs, i, null);
            
            let parentName = parentRefs[i].identifier.rootId;
            
            return new ScopeTypeItem(
                ScopeForm.indefinite,
                parentName
            );
        });

        let type = new ScopeTypeItem(
            ScopeForm.definite,
            rootId,
            options
        );

        scope.set(type);
    }
}
