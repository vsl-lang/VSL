import nearley from 'vsl-nearley';
import parser from './parser';

import VSLTokenizer from './vsltokenizer';
import ParserError from './parserError';

/**
 * A user-friendly class to take a string and parse VSL code. Unless you have a
 * specific application, you _probably_ want to be using this. Additionally this
 * also encapsulates tokenization, but unless you want that it doesn't need to
 * happen.
 */
export default class VSLParser {
    
    /**
     * Default constructor for a VSLParser, initalizes to an empty parser and
     * tokenizer state
     */
    constructor() {
        /** @private */
        this.tokenizer = new VSLTokenizer();
        
        /**
         * You probably should not directly use, but hey why not make this
         * public.
         */
        this.parser = new nearley.Parser(parser.ParserRules, parser.ParserStart, {lexer: this.tokenizer});
    }
    
    /**
     * Queues a string to be parsed. This will return something if the string
     * was properly parsed. This uses the generates `parser` file and
     * VSLTokenizer which is used to tokenize the strings. If you already have
     * tokens, don't use this function. Don't forget to wrap this function in a
     * `try { ... } catch(e) { ... }` because it'll throw. Additionally check
     * the error types to distringuish what happend (see below for infos).
     *
     * @throws {ParserError} - thrown if an ambiguous string is encountered.
     *     this should never happen and a bug report should be promptly
     *     submitted when and if this ever happens.
     *
     * @throws {Error} - thrown if an input has an error. You can wrap in a
     *     try { ... } catch(e) { ... } and use that to handle an error. It is
     *     reccomended to use the `highlight` and `indicator` functions to
     *     generate a nice string showing the parse error relative to the code.
     *
     * @param {string} string - Input code to feed to the parser. This will also
     *     be tokenized, you probably want to keep hold of this so you can
     *     handle errors nicely.
     *
     * @return {?Node[]} - If this is a non-empty arary, the result is an AST
     *     with a `CodeBlock`(s) which you can transform and all. Otherwise if
     *     this is empty, that means the input is unfinished, potentially wait
     *     for further chunks from STDIN.
     */
    feed(string: string): ?Node[] {
        let results;
        try {
            results = this.parser.feed(string);
        } catch(e) {
            if (!e.offset)
                throw e;
            let pos = this.parser.lexer.positions[e.offset];
            throw new ParserError(
                `Unexpected token`,
                pos
            );
        }

        if (results.results.length > 1) {
            throw new ParserError(
                `Ambigous parsing (${results.results.length}) for:\n` +
                results.results.map(result => result.toAst()).join("\n")
            );
        }
            
        return results.results;
    }
}
