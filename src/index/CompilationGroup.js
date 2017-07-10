import PropogateModifierTraverser, { Behavior as p } from './PropogateModifierTraverser';

import CompilationStream from './CompilationStream';

import ParserError from '../vsl/parser/parserError';
import VSLParser from '../vsl/parser/vslparser';

import Transform from '../vsl/transform/transform';
import { CodeBlock } from '../vsl/parser/nodes/*';

/**
 * Represents the compilation of a single module. This doesn't actually have any
 * knoledge of a {@link VSLModule} or native modules, rather this represents a
 * group of 'streams' and handled their accesss scopes through the
 * {@link PropogateModifierTraverser}. This specifically uses:
 *
 *     {
 *         protected: p.Propogate,
 *         private: p.Hide,
 *         public: p.Propogate
 *     }
 *
 * If you want to inject modules you can set a shared scope instance by using
 * the CompilationGroup.lazyHook() which will specify a scope hook to other
 * {@link CompilationGroup}s.
 *
 * @example
 * let compilationGroup = new CompilationGroup()
 *
 * for (let file in files) {
 * 	let fileStream = compilationGroup.createStream()
 * 	fileStream.send(fs.readFileSync(file));
 * }
 *
 * let result = await compilationGroup.compile();
 *
 * @example
 * let compilationGroup = new CompilationGroup();
 * 
 * let stream = compilationGroup.createStream();
 * stream.send(prompt('vsl> '));
 * stream.handleRequest(done => done(prompt('>>>> ')));
 *
 * compilationGroup.compile();
 */
export default class CompilationGroup {
    /**
     * Creates compilation group from VSLModule. This will take the streams from
     * there and open up a compilation instance for them. Use `.createStream()`
     * to add a stream, then call compile.
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
        
        return ast[0];
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
        // Parse all ASTs in parallel
        let asts = await Promise.all( this.sources.map(::this.parse) );
        
        // This will be our new AST of the entire module with a global shared
        // scope
        let block = new CodeBlock(asts, null);
        
        // Hook all the news ASTs together
        // This will addd the public, protected, and no-access-modifier
        // declarations to our new scope (`block`).
        new PropogateModifierTraverser(
            {
                protected: p.Propogate,
                private: p.Hide,
                public: p.Propogate,
                none: p.Propogate
            },
            block.scope
        ).queue(asts); // `asts` is already an ast of sorts.
        
        // Now `block` is our AST with all the important things.
        console.log(block.scope);
    }
}
