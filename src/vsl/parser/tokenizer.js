/**
 * Tokenizer class.
 */
export default class Tokenizer {
    //TODO: fix type of tokenmatchers in esdoc
    /**
     * Creates a new Tokenizer object.
     * @param {(string|function(self: Tokenizer))[]} tokenMatchers An array of the escaped string form of a regex matching a token, a function to return a token given the matched text, the type of the returned token, and the scopes the regex should match in.
     * @param {number} scope Starting scope of the lexer
     */
    constructor (tokenMatcherDict, scope=0) {
        this.tokenMatcherDict = tokenMatcherDict;
        for (let key in tokenMatcherDict)
            tokenMatcherDict[key] = tokenMatcherDict[key].map(function (object) {
                object[0] = new RegExp('^' + object[0].replace(/[\/\r\n\t]/g, match => ('\\' + {
                    '/': '/',
                    '\r': 'r',
                    '\n': 'n',
                    '\t': 't'
                }[match])));
                return object;
            });
        this.tokenMatchers = tokenMatcherDict[scope];
        this.scope = scope;
        this.variables = {};
    }
    
    /**
     * Tokenizes a given sequence of code
     * @param {string} code - The desired code chunk or string to tokenize
     * @return An array of tokens. If the token is of a complex type the format
     *         [value, TokenType]. Where `TokenType` is a positive integer in the
     *         enumeration of `TokenType` which represents the type of `value`
     */
    tokenize (code: string) {
        let tokens = [],
            indices = [],
            index = 0;
        while (code.length) {
            let success = false;
            for (let [regex, onSuccess, type] of this.tokenMatchers) {
                let match = regex.exec(code);
                if (match) {
                    let matched = match[0],
                        token = onSuccess(this, matched),
                        length = matched.length;
                    if (!length)
                        continue;
                    code = code.slice(length);
                    if (typeof token !== 'undefined') {
                        tokens.push(typeof type === 'undefined' ? token : [token, type]);
                        indices.push([index, index += length]);
                    } else
                        index += length;
                    success = true;
                    break;
                }
            }
            if (!success) {
                tokens.push(code[0]);
                indices.push([index, index += 1]);
            }
            success = false;
        }
        return { tokens, indices };
    }
    
    begin (scope) {
        this.scope = scope;
        this.tokenMatchers = this.tokenMatcherDict[scope];
    }
}