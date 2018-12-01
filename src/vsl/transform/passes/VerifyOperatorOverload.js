import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';

/**
 * Function overloads must have specific types. This ensures the correct
 * access modifiers etc. are applied to overloads.
 */
export default class VerifyOperatorOverload extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Verify::OperatorOverload");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Ensure the name is operator
        if (!(node.name instanceof t.OperatorName)) return;

        // The node this decl is wrapped in.
        const declNode = tool.declarationNode;
        if (!(
            declNode instanceof t.ClassStatement ||
            declNode instanceof t.EnumerationStatement
        )) {
            throw new TransformError(
                `Function overloading an operator must be within a type ` +
                `declaration`,
                node
            );
        }

        // If its an enumeration they cannot override == and !=
        if (declNode instanceof t.EnumerationStatement) {
            if (['==', '!='].includes(node.name.value)) {
                throw new TransformError(
                    `An enumeration cannot overload the ${node.name.value} ` +
                    `operator.`,
                    node
                );
            }
        }

        // Validate access modifiers
        const accessModifiers = node.access;

        // Cannot be private
        if (tool.isPrivate) {
            throw new TransformError(
                `Operator overloads cannot be private`,
                node
            );
        }

        // Must be static
        if (!accessModifiers.includes('static')) {
            throw new TransformError(
                `Function overloading an operator must be static`,
                node
            );
        }

        // Cannot be void
        if (!node.returnType || node.returnType.value === 'Void') {
            throw new TransformError(
                `Function overloading an operator cannot have void return`,
                node
            );
        }

        // Must have 1 or 2 args
        if (node.args.length < 1 || node.args.length > 2) {
            throw new TransformError(
                `Function overloading an operator must have either one or two ` +
                `arguments. One defines an unary operator overload, two ` +
                `defining a binary operator.`,
                node
            );
        }
    }
}
