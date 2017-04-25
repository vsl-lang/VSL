/**
 * Tokenizer class.
 */
export default class Tokenizer {
    /**
     * Creates a new Tokenizer object.
     * @param {array} tokenMatchers An array of the escaped string form of a regex matching a token, a function to return a token given the matched text, the type of the returned token, and the scopes the regex should match in.
     * @param {number} scope Starting scope of the lexer
     */
    constructor (tokenMatchers, scope=0) {
        this.tokenMatchers = tokenMatchers.map(function (object) {
            object[0] = new RegExp('^' + object[0].replace(/[\/\r\n\t]/g, match => ('\\' + {
                '/': '/',
                '\r': 'r',
                '\n': 'n',
                '\t': 't'
            }[match])));
            return object;
        });
        this.scope = scope;
        this.variables = {};
    }
    
    tokenize (code) {
        let tokens = [];
        while (code.length) {
            let success = false;
            for (let [regex, onSuccess, type, allowedScopes] of this.tokenMatchers) {
                if (!((allowedScopes || 1) & this.scope))
                    continue;
                let match = regex.exec(code);
                if (match) {
                    let matched = match[0];
                    let token = onSuccess(this, matched);
                    if (!matched.length)
                        continue;
                    code = code.slice(matched.length);
                    if (typeof token !== 'undefined')
                        tokens.push(typeof type === 'undefined' ? token : [token, type]);
                    success = true;
                    break;
                }
            }
            if (!success)
                throw 'LexError: No match found';
            success = false;
        }
        return tokens;
    }
    
    begin (scope) {
        this.scope = scope;
    }
}