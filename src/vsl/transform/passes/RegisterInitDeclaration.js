import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeInitItem from '../../scope/items/scopeInitItem';
import ScopeAliasArgItem from '../../scope/items/scopeAliasArgItem';
import ScopeFuncItemArgument from '../../scope/items/scopeFuncItemArgument';
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * This adds an initalizer to a class's subscope.
 */
export default class RegisterInitDeclaration extends Transformation {
    constructor() {
        super(t.InitializerStatement, "Register::InitDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        // Scope of init body
        const subscope = node.statements.scope;

        // Get class this initializer is for
        const owningClass = tool.nthParent(3);

        // Get the ScopeTypeItem for that class
        const classItem = owningClass.reference;

        // Get th class's name
        const className = classItem.rootId;

        // Go through params and form ScopeFuncItemArguments
        const initArgs = node.params.map(
            ({
                externalName: externalNameNode,
                typedId: {
                    identifier: { value: argName },
                    type: argTypeNode
                }
            }, index, all) => {
                const externalName = externalNameNode?.value || argName;
                const argType = new TypeLookup(argTypeNode, vslGetTypeChild).resolve(tool.scope),
                    sourceNode = all[index];
                const isOptional = false;

                // If this is a statement function, we'll add the arg to
                // subscope.
                if (subscope) {
                    let aliasItem = new ScopeAliasArgItem(
                        ScopeForm.definite,
                        argName,
                        {
                            source: sourceNode,
                            type: argType
                        }
                    );

                    subscope.set(aliasItem);
                    sourceNode.aliasRef = aliasItem;
                }

                return new ScopeFuncItemArgument(
                    externalName,
                    argType,
                    isOptional,
                    sourceNode
                );
            }
        );

        // Add the initalizer to the class
        let type = new ScopeInitItem(
            ScopeForm.definite,
            'init',
            {
                args: initArgs,
                source: node,
                returnType: classItem.selfType,
                initializingType: classItem
            }
        );

        // Also register as a class init
        const res = tool.assignmentScope.set(type);
        if (res === false) {
            throw new TransformError(
                "Redeclaration of initializer. This either means you have " +
                "another initializer with the exact same signature declared " +
                "or there is a function with the same name as the class and " +
                "the same format as the class",
                node, e.DUPLICATE_DECLARATION
            );
        }

        if (initArgs.length === 0) {
            classItem.implicitInitializer = type;
        }

        node.reference = type;
    }
}
