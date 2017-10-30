import ParserError from './parserError';

/**
 * @typedef {string|RegExp} TokenizerMatcher - Matches either the literal string
 *                                           or the regex.
 */

/**
 * @typedef {number} TokenizerType - Any value uniquely identifying a token type
 */

/**
 * @typedef {number} TokenizerState - Any state of the tokenizer.
 */

/**
 * @typedef {func(Tokenizer, string): ?string} TokenizerCallback - Used to
 * process a rule. If it returns `undefined` then the token is not included in
 * the token list.
 */

/**
 * @typedef {[TokenizerMatcher, ?TokenizerCallback, ?TokenizerType]} TokenizerRule
 */

/**
 * @typedef {Object} TokenizerState
 * @property {number} line - line number (0 represets first line)
 * @property {number} column - column (1 represents first char)
 * @property {number} index - index in code
 * @property {?number} length - length of token
 * @property {?string} value - token value
 */

/**
 * Tokenizer class.
 */
export default class Tokenizer {
    /**
     * Creates a new Tokenizer object.
     * @param {TokenizerRule[]} tokenMatchers - An array of
     *  the escaped string form of a regex matching a token, a function to
     *  return a token given the matched text, the type of the returned token,
     *  and the scopes the regex should match in.
     * @param {TokenizerScope} [scope=0] - Starting scope of the lexer
     * @param {TokenizerType[]} [tokenTypes=[]]
     */
    constructor (tokenMatchers, scope: number = 0, tokenTypes: string[] = []) {
        /** @private */
        this.tokenMatchers = tokenMatchers.map(tokenMatcher =>
            tokenMatcher.map(object => {
                if (object[0] instanceof RegExp) {
                    object[0] = new RegExp(object[0], 'g');
                }
                
                return object;
            })
        );
        
        /** @private */
        this.tokenMatcher = this.tokenMatchers[scope];
        
        /**
         * An object you can use to store data
         * @type {Object}
         */
        this.variables = {};
        
        /** @private */
        this.code = '';
        
        /** @private */
        this.originalCode = '';
        
        /**
         * List of all token positions
         * @type {TokenizerState[]}
         */
        this.positions = [];
        
        /** @private */
        this.index = 0;
        /** @private */
        this.line = 0;
        /** @private */
        this.column = 0;
    }
    
    save() {
        return {
            index: this.index,
            line: this.line,
            column: this.column
        }
    }
    
    latest() {
        return this.positions[this.positions.length - 1];
    }
    
    /**
     * @param {string} code New code.
     * @param {TokenizerState} info Position info for
     */
    reset(code, { index = 0, line = 0, column = 0 } = {}) {
        this.code = code.toString('utf-8');
        this.index = index;
        this.line = line;
        this.column = column;
    }
    
    /** @private */
    _positionFor(match, addToList) {
        
        if (addToList) {
            this.positions.push({
                value: match,
                line: this.line,
                column: this.column,
                index: this.index,
                length: match.length
            })
        }
        
        this.index += match.length;
        
        let lines = match.split(/[\r\n]/);
        let numLines = lines.length - 1;
        this.line += numLines;
        
        // Calculate column
        // If there is no newline then we merely added to last column
        // Otherwise length of last column
        if (numLines === 0) {
            this.column += match.length;
        } else {
            this.column = lines[lines.length - 1].length;
        }
    }
    
    /**
     * @return {TokenizerState} Next token, or undefined if there are no more tokens.
     */
    next() {
        if (this.index >= this.code.length) return;
        
        for (let i = 0; i < this.tokenMatcher.length; i++) {
            let [ matcher, onSuccess, type ] = this.tokenMatcher[i];
            
            var value;
            
            if (typeof matcher === 'string') {
                if (this.code.substr(this.index, matcher.length) === matcher) {
                    value = onSuccess(this, matcher);
                    this._positionFor(matcher, typeof value !== 'undefined');
                } else {
                    continue;
                }
            } else {
                // matcher is regex
                matcher.lastIndex = this.index;
                let match = matcher.exec(this.code);
                
                if (match && match.index === this.index) {
                    let literalMatch = match[0];
                    if (literalMatch.length === 0) continue;
                    
                    value = onSuccess(this, literalMatch);
                    this._positionFor(literalMatch, typeof value !== 'undefined');
                } else {
                    continue;
                }
            }
            
            // If there was no value, don't include it in the token list.
            // in that case get the next value.
            if (typeof value !== 'undefined') {
                return typeof type === 'undefined' ? { value } : [value, type];
            } else {
                i = 0; // When we rerun we want to try from beginning
                
                // Since no value returned, run again
                continue;
            }
        }
        
        if (this.index >= this.code.length) return;
            
        // Not succesful, so just tokenizer next char
        let char = this.code[this.index];
        this._positionFor(char, true);
        return { value: char };
    }
    
    /**
     * Tokenizes a given sequence of code
     * @param {string} code - The desired code chunk or string to tokenize
     * @return An array of tokens. If the token is of a complex type the format
     *         [value, TokenType]. Where `TokenType` is a positive integer in the
     *         enumeration of `TokenType` which represents the type of `value`
     */
    tokenize(code) {
        this.reset(code);
        
        let result = [],
            next = null;
            
        while (this.index < this.code.length) {
            next = this.next();
            if (next) result.push(next);
        }
            
        return result;
    }
    
    /**
     * Returns a formatted error message given a token.
     *
     * @param {Object} token The token causing the error.
     */
    formatError(token: Object) {
        return token;
    }
    
    has(tokenType) {
        return true;
    }
    
    begin(scope) {
        this.tokenMatcher = this.tokenMatchers[scope];
    }
}
