import nearley from 'nearley';
import parser from './parser';

import { VSLTokenizer } from './vsltokenizer';

export default class VSLParser {
    constructor() {
        this.parser = new nearley.Parser(parser.ParserRules, parser.ParserStart)
    }
    
    feed(string: string) {
        
        let tokenizer = new VSLTokenizer();
        
        this.parser.feed(tokenizer.tokenize(string));
        
        return this.parser.results;
    }
}