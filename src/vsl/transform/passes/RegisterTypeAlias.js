import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * Creates a TypeAlias. This takes a created type and creates the reference for
 * it in the scope.
 */
export default class RegisterTypeAlias extends Transformation {
    constructor() {
        super(t.TypeAlias, "Register::TypeAlias");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        
        let name = node.name.value;
        let aliasedTypeNode = node.type;
        
        let aliasedType = new TypeLookup(aliasedTypeNode, vslGetTypeChild)
            .resolve(scope);
        
        let type = new ScopeTypeAliasItem(
            ScopeForm.definite,
            name,
            { item: aliasedType }
        );

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
