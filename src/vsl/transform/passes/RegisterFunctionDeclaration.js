import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';
import ScopeFuncItemArgument from '../../scope/items/scopeFuncItemArgument';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * This adds argument types and return types to a function's entry in the local
 * scope.
 */
export default class RegisterFunctionDeclaration extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Register::FunctionDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        let name = node.name.value;

        // Handle -> Void.
        if (node.returnType instanceof t.Identifier && node.returnType.value !== "Void") {
            node.returnRef = new TypeLookup(node.returnType, vslGetTypeChild).resolve(scope);
        }


        let argList = node.args.map(
            ({
                typedId: {
                    identifier: argName,
                    type: argTypeNode
                }
            }, index, all) => new ScopeFuncItemArgument(
                argName,
                new TypeLookup(argTypeNode, vslGetTypeChild).resolve(scope),
                false,
                all[index]
            )
        );

        let type = new ScopeFuncItem(
            ScopeForm.definite,
            name,
            {
                args: argList,
                source: node,
                returnType: node.returnRef
            }
        );

        // Register the type in the parent scope
        let res = scope.set(type);
        if (res === false) {
            throw new TransformError(
                "Redeclaration of function. This means you have a function " +
                "with the exact same signature declared",
                node, e.DUPLICATE_DECLARATION
            );
        }

        node.scopeRef = type;
    }
}
