import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

/**
 * Verifies returns of `ReturnStatement`s on `DynamicFieldStatement`.
 */
export default class VerifyDynamicFieldStatementReturnStatement extends Transformation {
    constructor() {
        super(t.DynamicFieldStatement, "Verify::DynamicFieldStatementReturnStatement");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Check return type of getter
        const returnType = node.type;

        // Check if getter
        const getter = node.getter;
        if (!getter) return;

        // Run if returnType is not `null` indicating that we must have return.
        //  if it is `none`, then we'll have to just validate that all child
        //  returns just don't have any value.
        let validReturn = this.validateReturn(getter.body, returnType, tool);

        // If all paths do not return, error.
        if (validReturn === false) {
            throw new TransformError(
                `Getter should return a value of ${returnType} however all ` +
                `paths did not return.`,
                node
            );
        }
    }

    /**
     * Recursively validates return.
     * @param {Node} node                Node to start validating on.
     * @param {ScopeTypeItem} returnType The return type.
     * @param {ASTTool} tool AST tool from modify.
     */
    validateReturn(node, returnType, tool) {
        switch (node.constructor) {
            case t.CodeBlock:
                for (let i = 0; i < node.statements.length; i++) {
                    let definiteReturn =
                        this.validateReturn(node.statements[i], returnType, tool);

                    // If one of the nodes definetly returns we will return
                    //  true.
                    if (definiteReturn) return true;
                }

                // Otherwise return false if all substatements to not definetly
                // return.
                return false;

            // Return statement always returns (duh) but we must first validate
            // the return type.
            case t.ReturnStatement:
                if (node.expression === null) {
                    throw new TransformError(
                        `Return statement must return \`${returnType}\` ` +
                        `however this statement returns \`Void\``,
                        node
                    );
                }

                // Now we'll set the expected return type on the return node.
                node.expectedReturnType = returnType;
                return true;

            case t.IfStatement:
                // If two bodies exist, we must ensure both always return.
                if (node.trueBody && node.falseBody) {
                    // For ifs, just check if both sides will return
                    return node.alwaysReturns = (
                        this.validateReturn(node.trueBody, returnType, tool) &&
                        this.validateReturn(node.falseBody, returnType, tool)
                    );
                } else {
                    // We still want to validate (if) it returns, that it is
                    // correct.
                    this.validateReturn(node.trueBody, returnType, tool)

                    // If only returns in one case, then this does not definetly
                    // return.
                    return node.alwaysReturns = false;
                }

            // All other nodes will be assumed to not return
            default:
                return false;
        }
    }
}
