import nearley from 'vsl-nearley';
import parser from './parser';

import VSLTokenizer from './vsltokenizer';

export default class VSLParser {
    constructor() {
        this.tokenizer = new VSLTokenizer();
        this.parser = new nearley.Parser(parser.ParserRules, parser.ParserStart, {lexer: this.tokenizer});
        this.error = null;
    }
    
    feed(string: string) {
        let results = this.parser.feed(string);
        return [results.results[0]];
    }
}