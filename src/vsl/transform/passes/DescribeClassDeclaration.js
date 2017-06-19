import Transformation from '../transformation';
import t from '../../parser/nodes';

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
        let scope = node.parentScope.scope;
        let rootId = node.name.identifier.rootId;

        // Okay do a lookup for these
        let parentRefs = node.superclasses;
        let parents = [];
        let options = {
            isInterface: false
        };

        // Transform
        if (parentRefs !== null) {
            parentRefs.forEach((_, i) => {
                // Transform the children (i.e. resolve paths)
                tool.queueThenDeep(parentRefs[i], parentRefs, i, null);

                let candidateId = parentRefs[i].identifier.rootId;

                // Lookup
                let candidateResult = scope.get(new ScopeTypeItem(candidateId));
                if (candidateResult === null) parents.push(candidateId);
                else parents.push(candidateResult);
            });

            options.superclasses = parents;
        }

        let type = new ScopeTypeItem(
            rootId,
            node.statements.scope,
            options
        );

        node.scopeRef = type
        scope.set(type);
    }
}
