import VSLPreprocessor from './transformers/vslpreprocessor';
import VSLTransformer from './transformers/vsltransformer';

/**
 * Performs transformation on a given AST root array. By default the parser will
 * output the top-level AST result as a `CodeBlock[]`, so you can just pass the
 * parser output into here safely. Don't forget to load in the STL (by inserting
 * it into the CodeBlock).
 * 
 * @param {CodeBlock[]} ast - The AST 
 */
export default function transform(ast: CodeBlock[]) {
    new VSLPreprocessor().queue(ast);
    new VSLTransformer().queue(ast);
}
