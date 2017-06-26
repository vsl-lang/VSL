/**
 * Tokenizer class.
 */
//TODO: docs
export default class Tokenizer {
    //TODO: fix type of tokenmatchers in esdoc
    /**
     * Creates a new Tokenizer object.
     * @param {string[]|function(self: Tokenizer)[]} tokenMatchers - An array of
     *  the escaped string form of a regex matching a token, a function to
     *  return a token given the matched text, the type of the returned token,
     *  and the scopes the regex should match in.
     * @param {number} [scope=0] - Starting scope of the lexer
     * @param {string[]} [tokenTypes=[]]
     */
    constructor (tokenMatchers, scope: number = 0, tokenTypes: string[] = []) {
        this.tokenMatchers = tokenMatchers.map(tokenMatcher => tokenMatcher.map(object => {
            object[0] = object[0] instanceof RegExp ? object[0] : new RegExp('^' + object[0].replace(/[\/\r\n\t]/g, match => ('\\' + {
                '/': '/',
                '\r': 'r',
                '\n': 'n',
                '\t': 't'
            }[match])).replace(/^[a-zA-Z]+$/, '$&(?=$|[^a-zA-Z0-9_])'));
            return object;
        }));
        this.tokenMatcher = tokenMatchers[scope];
        this.scope = scope;
        this.variables = {};
        this.code = '';
        this.originalCode = '';
        this.positions = [];
        this.index = 0;
        this.line = 0;
        this.column = 0;
    }
    
    save () {
        return {
            index: this.index,
            line: this.line,
            column: this.column
        }
    }
    
    latest () {
        return this.positions[this.positions.length - 1];
    }
    
    /**
     * @param {string} code New code.
     * @param {Info} info Position info for
     */
    reset (code: string, info: Object=null) {
        this.code = code;
        info = info || {index: 0, line: 0, column: 0};
        this.index = info.index;
        this.line = info.line;
        this.column = info.column;
    }
    
    /**
     * @return Next token, or undefined if there are no more tokens.
     */
    next () {
        let code = this.code,
            token = [],
            success = false;
        while (true) {
            if (code.length === 0)
                return undefined;
            for (let [regex, onSuccess, type] of this.tokenMatcher) {
                let match = regex.exec(code);
                if (match) {
                    let matched = match[0],
                        value = onSuccess(this, matched),
                        length = matched.length;
                    if (!length)
                        continue;
                    this.code = code = code.slice(length);
                    if (typeof value !== 'undefined') {
                        this.positions.push({
                            line: this.line,
                            column: this.column,
                            index: this.index,
                            length
                        });
                        this.column += length;
                        this.index += length;
                        return typeof type === 'undefined' ? {value} : [value, type];
                    } else
                        this.index += length;
                    success = true;
                    break;
                }
            }
            if (!success) {
                let value = code[0];
                this.code = code = code.slice(1);
                this.positions.push({
                    line: this.line,
                    column: this.column,
                    index: this.index,
                    length: 1
                });
                this.column++;
                this.index++;
                return {value};
            }
        }
    }
    
    /**
     * Tokenizes a given sequence of code
     * @param {string} code - The desired code chunk or string to tokenize
     * @return An array of tokens. If the token is of a complex type the format
     *         [value, TokenType]. Where `TokenType` is a positive integer in the
     *         enumeration of `TokenType` which represents the type of `value`
     */
    tokenize (code: string) {
        this.reset(code);
        let result = [],
            next = null;
        while ((next = this.next()))
            result.push(next);
        return result;
    }
    
    /**
     * Returns a formatted error message given a token.
     *
     * @param {Token} token The token causing the error.
     */
    formatError (token: Object) {
        return token;
    }
    
    has (tokenType) {
        return false;
        //too slow since lexer will need to return {type: value} instead of array
        //['integer', 'decimal', 'string', 'identifier'].includes(tokenType);
    }
    
    begin (scope) {
        this.scope = scope;
        this.tokenMatcher = this.tokenMatchers[scope];
    }
    
    newline (lines: number=1, column: number=-1) {
        this.line += lines;
        this.column = column;
    }
}
