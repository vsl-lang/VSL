import Transformation from '../transformation';
import TransformError from '../transformError';
import e from '../../errors';
import t from '../../parser/nodes';

import Scope from '../../scope/scope';
import ScopeForm from '../../scope/scopeForm';
import ScopeItem from '../../scope/scopeItem';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';

import GenericInfo from '../../scope/items/genericInfo';
import GenericParameterItem from '../../scope/items/genericParameterItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * A pre-processing entry for an interface declaration. This goes top-down and
 * "registers" or adds the class to a global table of all items for at least
 * that scope.
 */
export default class DescribeInterfaceDeclaration extends Transformation {
    constructor() {
        super(t.InterfaceStatement, "Describe::InterfaceDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = tool.assignmentScope;
        let semanticSubscope = node.statements.scope;
        let className = node.name.value;

        const subscope = new Scope();
        const staticSubscope = new Scope();

        // Handles generic classes
        const genericParameters = [];

        // Process generics
        tool.queueThen('generics', null);

        for (let i = 0; i < node.generics.length; i++) {
            // Populate generic nodes
            const genericDeclNode = node.generics[i];
            const genericParameter = new GenericParameterItem(ScopeForm.definite, genericDeclNode.name.value, {});

            genericParameters.push(genericParameter);
            if (semanticSubscope.set(genericParameter) === false) {
                throw new TransformError(
                    `Generic parameter ${genericDeclNode.name} for class ` +
                    `${className} already has another item with the name the ` +
                    `parameter would take.`,
                    genericDeclNode,
                    e.DUPLICATE_DECLARATION
                );
            }
        }

        // Get the superclasses/interfaces
        const interfaces = node.superclasses;

        let opts = {
            isInterface: true,
            subscope: subscope,
            source: node,
            interfaces: interfaces,
            superclass: superclass,
            staticScope: staticSubscope,
            isScopeRestricted: tool.isPrivate,
            genericInfo: new GenericInfo({
                parameters: genericParameters
            }),
            resolver: (self) => {
                // Resolve all interfaces
                for (let i = 0; i < self.interfaces.length; i++) {
                    // If we don't have a ref to the interface yet then we'll
                    // do that.
                    const interfaceNode = self.interfaces[i];
                    const interfaceName = interfaceNode.value;

                    // Resolve superclass
                    const scopeItem = scope.getAsDelegate(
                        new ScopeTypeItem(ScopeForm.query, interfaceName),
                        interfaceNode
                    );

                    if (!scopeItem) {
                        throw new TransformError(
                            `No interface with name \`${interfaceName}\` in this scope.`,
                            interfaceNode,
                            e.UNDECLARED_IDENTIFIER
                        );
                    }


                    if (!scopeItem.isInterface) {
                        throw new TransformError(
                            `The type \`${interfaceName}\` was not an ` +
                            `interface. Interfaces cannot extend a superclass.`,
                            interfaceNode,
                            e.INTERFACE_CANNOT_INHERIT_CLASS
                        );
                    }

                    // Ensure the superclass is specialized
                    if (scopeItem.isGeneric) {
                        throw new TransformError(
                            `You must specialize generic interface before ` +
                            `attempting to implement it.`,
                            interfaceNode,
                            e.GENERIC_SPECIALIZATION_REQUIRED
                        );
                    }

                    self.interfaces[i] = scopeItem;
                }
            }
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
