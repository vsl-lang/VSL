import VSLPreprocessor from './transformers/vslpreprocessor';
import VSLTransformer from './transformers/vslpreprocessor';

import STL from '../stl/stl';

/**
 * Performs transformation on a given AST root array. By default the parser will
 * output the top-level AST result as a `CodeBlock[]`, so you can just pass the
 * parser output into here safely.
 * 
 * @param {CodeBlock[]} ast - The AST 
 * @param {boolean} [disableSTL=false] - Whether the STL should be disabled. 99%
 *     of the time you probably don't want this
 */
export default function transform(ast: CodeBlock[]) {
    new VSLPreprocessor().queue(ast);
    new VSLTransformer().queue(ast);
}