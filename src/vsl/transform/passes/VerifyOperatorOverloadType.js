import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';

/**
 * Function overloads must have specific types. This ensures the correct
 * access modifiers etc. are applied to overloads.
 */
export default class VerifyOperatorOverloadType extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Verify::OperatorOverloadType");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Ensure the name is operator
        if (!(node.name instanceof t.OperatorName)) return;

        const functionRef = node.reference;
        if (functionRef.owner.owner !== functionRef.args[0].type) {
            throw new TransformError(
                `Operator overload's first argument type must be same as the ` +
                `class it is in.`,
                node
            );
        }
    }
}
