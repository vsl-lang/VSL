import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeDynFieldItem from '../../scope/items/scopeDynFieldItem';
import ScopeAliasArgItem from '../../scope/items/scopeAliasArgItem';
import { AliasType } from '../../scope/items/scopeAliasItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * This registers a dyn field statement.
 */
export default class RegisterDynamicFieldStatement extends Transformation {
    constructor() {
        super(t.DynamicFieldStatement, "Register::DynamicFieldStatement");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = tool.scope;
        let name = node.name.identifier.value;

        node.type = new TypeLookup(node.name.type, vslGetTypeChild).resolve(scope);

        let type = new ScopeDynFieldItem(
            ScopeForm.definite,
            name,
            {
                source: node,
                aliasType: AliasType.dynamic,
                type: node.type
            }
        );

        // Register setter parameter if possible
        if (node.setter) {
            const parameter = new ScopeAliasArgItem(
                ScopeForm.definite,
                node.setter.parameter.value,
                {
                    source: node.setter.parameter,
                    aliasType: AliasType.default,
                    type: node.type
                }
            );

            node.setter.parameterRef = parameter;
            node.setter.body.scope.set(parameter);
        }

        // Register the type in the parent scope
        let res = tool.assignmentScope.set(type);

        if (res === false) {
            throw new TransformError(
                "Redeclaration of field. This means you have a field with " +
                "the exact same name declared",
                node,
                e.DUPLICATE_DECLARATION
            );
        }

        node.reference = type;
    }
}
