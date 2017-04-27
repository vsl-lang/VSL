import nearley from 'nearley';
import parser from './parser';

import VSLTokenizer from './vsltokenizer';

export default class VSLParser {
    constructor () {
        this.tokenizer = new VSLTokenizer();
        this.parser = new nearley.Parser(parser.ParserRules, parser.ParserStart);
        this.error = null;
    }
    
    feed (string: string) {
        let tokens = this.tokenizer.tokenize(string);
        
        try {
            this.parser.feed(tokens.tokens);
        } catch(e) {
            let offset = e.offset;
            if (typeof offset === 'undefined')
                throw e;
            this.error = tokens.indices[offset];
            return null;
        }
        
        return this.parser.results;
    }
}