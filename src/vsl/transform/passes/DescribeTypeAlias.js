import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';
import e from '../../errors';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * This adds an indefinite typealias to the scope.
 */
export default class DescribeTypeAlias extends Transformation {
    constructor() {
        super(t.TypeAlias, "Describe::TypeAlias");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        
        let name = node.name.value;
        let aliasedTypeNode = node.type;
        
        let type = new ScopeTypeAliasItem(
            ScopeForm.indefinite,
            name,
            {
                item: aliasedTypeNode,
                resolver: (self) => {
                    self._ref = new TypeLookup(self._ref, vslGetTypeChild)
                        .resolve(scope);
                }
            }
        );

        if (scope.set(type) === false) {
            throw new TransformError(
                `Duplicate declaration of typealias ${name}. In this scope `
                + `there is already another typealias with that name.`,
                node, e.DUPLICATE_DECLARATION
            );
        } else {
            node.scopeRef = type;
        }
    }
}
