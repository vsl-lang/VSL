import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';

import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

/**
 * Verifies returns of `ReturnStatement`s.
 */
export default class VerifyReturnStatement extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Verify::ReturnStatement");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Only apply for code block functions
        // It doesn't make sense to apply for native functions for example.
        if (!(node.statements instanceof t.CodeBlock)) return;

        // Check return type (ref)
        const returnType = node.returnRef;

        // Run if returnType is not `null` indicating that we must have return.
        //  if it is `none`, then we'll have to just validate that all child
        //  returns just don't have any value.
        let validReturn = this.validateReturn(node.statements, returnType, tool);

        // If all paths do not return, error.
        if (returnType !== null && validReturn === false) {
            throw new TransformError(
                `Function is specified to return a value of ${returnType} ` +
                `however all paths did not return. `,
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
                if (returnType === null) {
                    // If there is no return type but one has been provided we
                    // will error.
                    if (node.expression !== null) {
                        throw new TransformError(
                            `Return statement has an expression however ` +
                            `\`Void\` functions cannot have a return value. ` +
                            `If you wish to return a value, specify a return ` +
                            `type.`,
                            node
                        );
                    }

                    return true;
                } else {
                    let returnTypeCandidate = new TypeCandidate(returnType);

                    // First, also validate type. We'll type deduct this node.
                    let result = new RootResolver(node.expression, vslGetChild, tool.context)
                        .resolve((constraint) => {
                            switch (constraint) {
                                case ConstraintType.RequestedTypeResolutionConstraint:
                                    return returnTypeCandidate;
                                default: return null;
                            }
                        });
                }

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
