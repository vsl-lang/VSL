import VSLPreprocessor from './transformers/vslpreprocessor';
import VSLTransformer from './transformers/vsltransformer';

/**
 * Performs transformation on a given AST root array. By default the parser will
 * output the top-level AST result as a `CodeBlock[]`, so you can just pass the
 * parser output into here safely. Don't forget to load in the STL (by inserting
 * it into the CodeBlock).
 *
 * @param {CodeBlock[]} ast - The AST
 * @param {?TransformationContext} context - The context to pass to the
 *                                         first transformer, should be
 *                                         propogated to the next.
 * @throws {TransformError} Passes may throw TransformationErrors which should
 *                          be handled.
 * @return {TransformationContext} The context of the last transformer
 */
export default function transform(ast: CodeBlock[], context: TransformationContext) {
    let preprocessor = new VSLPreprocessor(context);
    preprocessor.queue(ast);

    let res = new VSLTransformer(preprocessor.context);
    res.queue(ast)
    return res.context;
}
