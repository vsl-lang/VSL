import TransformError from '../transformError';
import Transformation from '../transformation';
import t from '../../parser/nodes';
import e from '../../errors';

/**
 * Implements dynamic dispatch. For every function decl on a subclass we'll
 * check if it may overlap on a superclass.
 */
export default class VerifyDynamicDispatch extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Verify::DynamicDispatch");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Two conditions we need to check for. First if a method at all.

        const parentClassNode = tool.declarationNode;

        // If it is in a class and it is not static that is koalaification for
        // being non-static.
        const isMethod = parentClassNode && !tool.isStatic;

        if (!isMethod) {
            if (node.isOverriding) {
                throw new TransformError(
                    `Unexpected \`override\` keyword on non-method.`,
                    node,
                    e.UNEXPECTED_OVERRIDE
                );
            }

            return;
        }

        // Check if superclass
        const parentClass = parentClassNode.reference;
        const hasSuperClass = parentClass.hasSuperClass;

        // Get the context with which the superclass is called

        if (!hasSuperClass) {
            if (node.isOverriding) {
                throw new TransformError(
                    `Unexpected \`override\` keyword on method in class ` +
                    `that does not inherit.`,
                    node,
                    e.UNEXPECTED_OVERRIDE
                );
            }

            return;
        }

        // Get query and check if in superscope.
        const methodQuery = node.reference.getQuery();
        const methodBeingOverriden = parentClass.superclass.subscope.get(methodQuery);
        const doesOverrideMethod = !!methodBeingOverriden;

        if (!doesOverrideMethod) {
            if (node.isOverriding) {
                throw new TransformError(
                    `Unexpected \`override\` keyword on method that does not ` +
                    `override any method from the superclass`,
                    node,
                    e.UNEXPECTED_OVERRIDE
                );
            }

            return;
        } else if (doesOverrideMethod && !node.isOverriding) {
            throw new TransformError(
                `Expected \`override\` keyword on method that overrides a ` +
                `method from the superclass`,
                node,
                e.EXPECTED_OVERRIDE
            );
        }

        // Specify the current function overrides
        methodBeingOverriden.addFunctionWhichOverrides(node.reference);
    }
}
