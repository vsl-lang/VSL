import Transformation from '../transformation';
import TransformError from '../transformError';
import e from '../../errors';
import t from '../../parser/nodes';

import Scope from '../../scope/scope';
import ScopeForm from '../../scope/scopeForm';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';
import ScopeGenericItem from '../../scope/items/scopeGenericItem';
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';

import GenericInfo from '../../scope/items/genericInfo';
import GenericParameterItem from '../../scope/items/genericParameterItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

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

        let subscope = node.statements.scope;
        const staticSubscope = new Scope();

        // Handles generic classes
        const genericParameters = [];
        tool.queueThen('generics', null);

        for (let i = 0; i < node.generics.length; i++) {
            // Populate generic nodes
            const genericDeclNode = node.generics[i];
            const genericParameter = new GenericParameterItem(ScopeForm.definite, genericDeclNode.name.value, {});

            genericParameters.push(genericParameter);
            if (subscope.set(genericParameter) === false) {
                throw new TransformError(
                    `Generic parameter ${genericDeclNode.name} for class ` +
                    `${className} already has another item with the name the ` +
                    `parameter would take.`,
                    genericDeclNode,
                    e.DUPLICATE_DECLARATION
                );
            }
        }

        let opts = {
            subscope: node.statements.scope,
            isInterface: false,
            mockType: node.mockType,
            subscope: subscope,
            source: node,
            staticScope: staticSubscope,
            isScopeRestricted: tool.isPrivate,
            genericInfo: new GenericInfo({
                parameters: genericParameters
            })
        };

        const type = new ScopeTypeItem(
            ScopeForm.indefinite,
            className,
            opts
        );

        if (type.isGeneric) {
            type.selfType = ScopeGenericSpecialization.specialize(type, genericParameters);
        }

        if (scope.set(type) === false) {
            throw new TransformError(
                `Duplicate declaration of class ${className}. In this scope ` +
                `there is already another class with that name.`,
                node, e.DUPLICATE_DECLARATION
            );
        } else {
            subscope.owner = type;
            staticSubscope.owner = type;
            staticSubscope.isStaticContext = true;
            node.reference = type;
        }
    }
}
