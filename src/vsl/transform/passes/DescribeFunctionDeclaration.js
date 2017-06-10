import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import ScopeFuncItemArgument from '../../scope/items/scopeFuncItemArgument';
import ScopeFuncItem from '../../scope/items/scopeFuncItem';

/**
 * Describes a class declaration. Does NOT register any of the child functions
 * or such.
 *
 * This may call other registrars declared further down the line without this
 * being completed in terms of generation
 */
export default class DescribeFunctionDeclaration extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Describe::FunctionDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        // The root class name (primary associate in scope)
        let rootId = node.name.identifier.rootId;

        // The arg list. (ScopeFuncItemArgument[])
        let args = [];

        // Generate list of all args
        for (let i = 0; i < node.args.length; i++) {
            let arg = node.args[i];
            let type = arg.typedId.type;
            let name = arg.typedId.identifier.identifier.rootId; // public name

            let isOptional = false; // Whether the argument is optional
                                    // This should be determined off the type also

            // If a function arg doesn't have a type (i.e.) is undef. error
            if (!type) {
                throw new TransformError(
                    `Expected to have a type but could not find any type.`,
                    node.args[i]
                )
            }

            args.push(
                new ScopeFuncItemArgument(
                    name,
                    isOptional,
                    type
                )
            )
        }

        let type = new ScopeFuncItem(
            rootId,
            args
        );

        // Register the type in the parent scope
        let res = node.parentScope.scope.set(type);
        if (res === false) {
            throw new TransformError(
                "Redeclaration of function. This means you have a function " +
                "with the exact same signature declared",
                node
            );
        }
    }
}
