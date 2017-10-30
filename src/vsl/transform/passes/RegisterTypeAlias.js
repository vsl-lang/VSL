import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';

/**
 * A pre-processing entry for a class declaration. This goes top-down and
 * "registers" or adds the class to a global table of all items for at least
 * that scope.
 */
export default class DescribeClassDeclaration extends Transformation {
    constructor() {
        super(t.TypeAlias, "Describe::ClassDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        
        let name = node.name.value;
        let aliasedType = node.type;

        if (scope.set(type) === false) {
            throw new TransformError(
                `Duplicate declaration of typealias ${name}. In this scope `
                + `there is already another typealias with that name.`,
                node, e.DUPLICATE_DECLARATION
            )
        } else {
            node.scopeRef = type;
        }
    }
}
