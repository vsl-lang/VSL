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
 * A pre-processing entry for a class declaration. This goes top-down and
 * "registers" or adds the class to a global table of all items for at least
 * that scope.
 */
export default class DescribeClassDeclaration extends Transformation {
    constructor() {
        super(t.ClassStatement, "Describe::ClassDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = tool.assignmentScope;
        let semanticSubscope = node.statements.scope;
        let className = node.name.value;

        // If this is being 'manifested as root' then we'll handle sepecially
        if (node.annotations.map(_ => _.name).includes('manifestAsRoot')) {
            // If this class is to be manifested as root then OK we'll do that
            if (tool.context.hasManifestRoot) {
                throw new TransformError(
                    `Cannot manifest this class as the root class as it already ` +
                    `has an owner.`,
                    node
                );
            }

            node.reference = ScopeTypeItem.RootClass;
            ScopeTypeItem.RootClass.rootId = className;
            ScopeTypeItem.RootClass.source = node;
            scope.set(node.reference);
            tool.context.hasManifestRoot = true;
            return;
        }


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
        const superclass = node.superclasses[0] || null;
        const interfaces = node.superclasses.slice(1);

        let opts = {
            isInterface: false,
            mockType: node.mockType,
            subscope: subscope,
            source: node,
            interfaces: interfaces,
            superclass: superclass,
            staticScope: staticSubscope,
            isScopeRestricted: tool.isPrivate,
            isByValue: node.isStructure,
            genericInfo: new GenericInfo({
                parameters: genericParameters
            }),
            resolver: (self) => {
                // Resolve superclass if there is one
                if (self.hasSuperClass) {
                    const superclassNode = self.superclass;
                    const superclassName = superclassNode.value;

                    // Resolve superclass
                    const scopeItem = new TypeLookup(superclassNode, vslGetTypeChild).resolve(semanticSubscope);

                    if (!scopeItem) {
                        throw new TransformError(
                            `No class with name \`${superclassName}\` in this scope.`,
                            superclassNode,
                            e.UNDECLARED_IDENTIFIER
                        );
                    }

                    // If it is interface then we say no subclass and move this
                    // to interface list.
                    if (scopeItem.isInterface) {
                        self.interfaces.unshift(self.superclass);
                        self.superclass = ScopeTypeItem.RootClass;
                    } else {

                        // Otherwise it is a class see if it can be subclassed.
                        if (!scopeItem.canSubclass()) {
                            throw new TransformError(
                                `Cannot subclass type with name ` +
                                `\`${superclassName}\``,
                                superclassNode,
                                e.CANNOT_SUBCLASS_TYPE
                            );
                        }

                        // Ensure the superclass is specialized
                        if (scopeItem.isGeneric) {
                            throw new TransformError(
                                `You must specialize generic superclass before ` +
                                `attempting to inherit it.`,
                                superclassNode,
                                e.GENERIC_SPECIALIZATION_REQUIRED
                            );
                        }

                        // Otherwise we are then all good
                        self.superclass = scopeItem;
                        scopeItem.subclasses.push(self);
                    }
                }

                // Resolve all interfaces
                for (let i = 0; i < self.interfaces.length; i++) {
                    // If we don't have a ref to the interface yet then we'll
                    // do that.
                    const interfaceNode = self.interfaces[i];

                    // Resolve superclass
                    const scopeItem = new TypeLookup(interfaceNode, vslGetTypeChild).resolve(semanticSubscope);

                    if (!scopeItem) {
                        throw new TransformError(
                            `No interface \`${interfaceNode}\` in this scope.`,
                            interfaceNode,
                            e.UNDECLARED_IDENTIFIER
                        );
                    }


                    if (!scopeItem.isInterface) {
                        if (self.superclass) {
                            throw new TransformError(
                                `The type \`${interfaceNode}\` is not an ` +
                                `interface. Multiple inheritance is not ` +
                                `supported at the moment.`,
                                interfaceNode,
                                e.CANNOT_MULTIPLE_INHERIT
                            );
                        } else {
                            throw new TransformError(
                                `The type \`${interfaceNode}\` was not an ` +
                                `interface. Did you mean to put this as the ` +
                                `first parameter so it would be treated as a ` +
                                `superclass?`,
                                interfaceNode,
                                e.SUPERCLASS_SHOULD_BE_FIRST_PARAM
                            );
                        }
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
