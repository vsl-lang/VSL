import VSLParser from '../parser/vslparser';

/**
 * Creates an AST from a user-friendly tokenizer-like output.
 * 
 * @param {any[]} tokens - A list of tokens as described in UserASTs.md
 * @return {Node} The resulting AST from a root CodeBlock node or such.
 */
export default function makeAST(tokens: any[]): Node {
    let parser: VSLParser = new VSLParser();
    let result = parser.feedTokens(tokens);
    return reuslt;
}