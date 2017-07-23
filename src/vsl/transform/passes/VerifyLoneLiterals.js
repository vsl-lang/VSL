import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';
/**
 * This validates that no 'lone literals' exist. I.e. top-level expressions
 * consisting solely of a single literal. If they are this will remove them from
 * the AST and emits an error.
 *
 * ### Examples
 * ```
 * 1 // warn & remove
 * ```
 *
 * ```
 * f(1) // OK
 * ```
 *
 * ```
 * func f() {
 *      1 // warn & remove
 * }
 * ```
 *
 * **Tracking:** See vsl-lang/VSL#52
 */
 export default class VerifyLoneLiterals extends Transformation {
     constructor() {
         super(t.ExpressionStatement, "Verify::LoneLiterals");
     }
     
     /** @overide */
     modify(node: Node, tool: ASTTool) {
         // Two conditions we need to check for:
         //  1. is top level
         //  2. child expression (.expression) is a literal
         
         // Get parent node. We add 1 beacuse the array containing all
         // statements would be a parent
         let parentNode = tool.nthParent(2);
         
         // Check if codeblock again
         let isTopLevel = parentNode instanceof t.CodeBlock;
         
         let isLiteralExpression = node.expression instanceof t.Literal;
         
         // If both of these are true then it's a lone expression and we'll
         // remove it
         if (isTopLevel && isLiteralExpression) {
             // TODO: warn
             tool.remove();
         }
     }
 }
