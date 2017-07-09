import CompilationStream from './CompilationStream';

import ParserError from '../vsl/parser/parserError';
import VSLParser from '../vsl/parser/vslparser';

import Transform from '../vsl/transform/transform';

/**
 * Represents the compilation of a single module or such. This links with other
 * modules and manages dependencies
 */
export default class CompilationGroup {
    /**
     * Creates compilation group from VSLModule. This will take the streams from
     * there and open up a compilation instance for them.
     *
     * @param {CompilationStream[]} sources A stream for each input. Parsed in
     *                                      parallel but hoisted in order.
     */
    constructor() {
        /** @private */
        this.sources = [];
    }
    
    /**
     * Returns a compilationStream which you can setup to send data.
     * @return {CompilationStream} A stream which you can send data to/from
     */
    createStream() {
        let stream = new CompilationStream();
        this.sources.push(stream);
        return stream;
    }
    
    /**
     * Parses a CompilationStream and returns the AST
     * @private
     */
    async parse(stream) {
        let dataBlock, ast;
        let parser = new VSLParser();
        
        while (null !== (dataBlock = await stream.receive())) {
            ast = parser.feed(dataBlock);
        }
        
        if (ast.length === 0) {
            // TODO: expand error handling here
            throw new ParserError(
                `Unexpected token EOF`
            );
        }
        
        return ast;
    }
    
    /**
     * Compiles the sources. It's reccomended to use a `CompilationIndex` to
     * manage this because configuration and modules happen there.
     *
     * @param  {CompilationStream} stream A compilation stream which will be
     * @return {CompilationResult}        An object describing all the
     *                                    compilation infos. See
     *                                    {@link CompilationResult} for more
     *                                    information.
     */
    async compile(stream) {
        let asts = await Promise.all( this.sources.map(::this.parse) );
        console.log(asts);
    }
}
