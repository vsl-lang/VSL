import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import t from '../../parser/nodes';

/**
 * This validates a dyn field decl.
 * ```
 */
export default class VerifyDynamicFieldDeclaration extends Transformation {
    constructor() {
        super(t.DynamicFieldStatement, "Verify::DynamicFieldDeclaration");
    }

    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // Verify has content
        if (node.items.length === 0) {
            throw new TransformError(
                `Must have at least one getter or setter definition inside ` +
                `dynamic field statement.`,
                node
            );
        }

        // Verify correct amount of getters/setters
        for (let i = 0; i < node.items.length; i++) {
            if (node.items[i] instanceof t.Getter) {
                if (node.getter) {
                    throw new TransformError(
                        `Only one getter should be in a given dynamic field ` +
                        `statement`,
                        node.items[i]
                    );
                }

                node.getter = node.items[i];
            } else if (node.items[i] instanceof t.Setter) {
                if (node.setter) {
                    throw new TransformError(
                        `Only one setter should be in a given dynamic field ` +
                        `statement`,
                        node.items[i]
                    );
                }

                node.setter = node.items[i];
            } else {
                throw new TransformError(
                    `Unexpected token in dynamic field statement definition ` +
                    `body`,
                    node.items[i]
                );
            }
        }
    }
}
