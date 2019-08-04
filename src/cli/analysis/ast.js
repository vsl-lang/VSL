import VSLParser from '../../vsl/parser/vslparser';

/**
 * Performs AST dump
 * @param {CompilationStream} stream
 * @param {AnalysisContext} context
 */
export default async function ASTAnalysis(stream, context) {
    try {
        const ast = await VSLParser.parseStream(stream);
        console.log(ast.toAst());
    } catch(error) {
        context.errorManager.dynamicHandle(error);
    }
}
