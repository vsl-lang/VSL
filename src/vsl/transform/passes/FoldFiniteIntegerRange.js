import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

/** @private */
const MAX_SAFE_LEN = Number.MAX_SAFE_INTEGER.toString().length - 1;

/** @private */
function isSafeInteger(node: Node): bool {
    return node instanceof t.Literal && node.type === TokenType.Integer &&
        node.literal.length <= MAX_SAFE_LEN;
}

/**
 * Transforms any finite with raw `VSLNodeType.Integer`s ({@link VSLNodeType})
 * 
 * Note: This won't apply for complex intger types as those wouldn't be the same
 * AST node as {@link Literal} only applies to simple literals.
 * 
 * This will transform integers within the bounds of a private `MAX_SAFE_LEN` which
 * is 15 on most platforms, set to: `Number.MAX_SAFE_INTEGER.toString().length - 1`.
 * A number is checked on whether it's string length exceedes this range. Due to 
 * integer promotion, it is not exactly safe to rely on the bounded Integer type
 * and therefore string types are used.
 * 
 * @example
 * BinaryExpression {
 *   lhs: Literal { literal: "1", type: Integer }, 
 *   rhs: Literal { literal: "3", type: Integer },
 *   op: "..."
 * }
 * 
 * =>
 * 
 * ArrayLiteral {
 *   data: [
 *     Literal { literal: "1", type: Integer },
 *     Literal { literal: "2", type: Integer },
 *     Literal { literal: "3", type: Integer }
 *   ]
 * }
 */
export default class FoldFiniteIntegerRange extends Transformation {
    constructor() {
        super(t.BinaryExpression, "Optimize::FoldFiniteIntegerRange");
    }
    
    modify(node: Node, tool: ASTTool) {
        
    }
}