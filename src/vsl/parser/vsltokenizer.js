import Tokenizer from './tokenizer';
import VSLScope from './vslscope';
import VSLTokenType from './vsltokentype';

function noop () {}
function passThrough (_, match) { return match; }
function strip (character) {
    return function transform (_, match) {
        return match.replace(character, '');
    };
}
const strip_ = strip('_');
function slice (start, end) {
    return function transform (_, match) {
        return match.slice(start, end);
    };
}
const slice1 = slice(1);

// from https://github.com/iamakulov/unescape-js/blob/master/src/index.js

const jsEscapeRegex = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))/g;

const usualEscapeSequences = {
    '0': '\0',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'v': '\v',
    '\'': '\'',
    '"': '"',
    '\\': '\\'
};

const fromHex = (str) => String.fromCodePoint(parseInt(str, 16));
const fromOct = (str) => String.fromCodePoint(parseInt(str, 8));

function unescapeString(_, match) {
    return match.slice(1, -1).replace(jsEscapeRegex, (_, __, varHex, longHex, shortHex, octal, specialCharacter) => {
        if (varHex !== undefined)
            return fromHex(varHex);
        if (longHex !== undefined)
            return fromHex(longHex);
        if (shortHex !== undefined)
            return fromHex(shortHex);
        if (octal !== undefined)
            return fromOct(octal);
        else
            return usualEscapeSequences[specialCharacter];
    });
}

/**
 * VSL-specific Tokenizer
 * 
 * This defines tokens for VSL. For further information see {@link Tokenizer}
 */
export default class VSLTokenizer extends Tokenizer {
    constructor () {
        let tokenMatchers = Array(VSLScope.MAX);
        tokenMatchers[VSLScope.Normal] = [
            ['(?:\\s|\\\\\\n)*[\r\n](?:\\s|\\\\\\n)*', (self, match) => {
                self.newline(match.match(/(?:\r|\n|\r\n)/).length, match.match(/[ \t\v\f]*$/)[0].length - 1);
                return '\n';
            }],
            ['(?:\\s|\\\\\\n)+', noop],
            ['//[^\r\n]+', noop],
            ['/\\*', self => {
                self.variables.commentDepth++;
                self.begin(VSLScope.Comment);
            }, null],
            ['"(?:\\\\["bfnrt\\/\\\\]|\\\\u[a-fA-F0-9]{4}|[^"\\\\])*"', unescapeString, VSLTokenType.String],
            ["'(?:\\\\['bfnrt\\/\\\\]|\\\\u[a-fA-F0-9]{4}|[^'\\\\])*'", unescapeString, VSLTokenType.String],
            ['\\$+[0-9]+', passThrough, VSLTokenType.SpecialArgument],
            ['\\$[a-zA-Z_][a-zA-Z0-9_]*', slice1, VSLTokenType.SpecialIdentifier],
            ['\\.[0-9_]+', strip_, VSLTokenType.Decimal],
            ['[0-9][0-9_]*\\.[0-9_]+', strip_, VSLTokenType.Decimal],
            ['(?:[1-5]?[0-9]|6[0-2])b[0-9a-zA-Z_]*', strip_, VSLTokenType.Integer],
            ['[0-9][0-9_]*', strip_, VSLTokenType.Integer],
            ['/[^\/\*]([^\\/\r\n]|\\[^\r\n])+/[gmixc]*', passThrough, VSLTokenType.Regex],
            ['\\.\\.\\.', passThrough],
            ['\\.\\.', passThrough],
            ['\\.', passThrough],
            ['->', passThrough],
            ['=>', passThrough],
            ['~>', passThrough],
            [':>', passThrough],
            ['@@@', passThrough],
            ['@@', passThrough],
            ['@', passThrough],
            [';', passThrough],
            [':', passThrough],
            [',', passThrough],
            ['\\+=', passThrough],
            ['-=', passThrough],
            ['\\*\\*=', passThrough],
            ['\\*=', passThrough],
            ['/=', passThrough],
            ['%=', passThrough],
            ['\\+', passThrough],
            ['-', passThrough],
            ['/', passThrough],
            ['%', passThrough],
            ['\\*\\*', passThrough],
            ['\\*', passThrough],
            ['<<=', passThrough],
            ['>>=', passThrough],
            ['<<', passThrough],
            ['>>', passThrough],
            ['==', passThrough],
            ['!=', passThrough],
            ['<>', passThrough],
            ['<=>', passThrough],
            ['<=', passThrough],
            ['>=', passThrough],
            ['<', passThrough],
            ['>', passThrough],
            ['=', passThrough],
            [':=', passThrough],
            ['&=', passThrough],
            ['\\|=', passThrough],
            ['\\^=', passThrough],
            ['&&', passThrough],
            ['\\|\\|', passThrough],
            ['!', passThrough],
            ['&', passThrough],
            ['\\|', passThrough],
            ['~', passThrough],
            ['\\^', passThrough],
            ['\\?', passThrough],
            ['and', passThrough],
            ['or', passThrough],
            ['not', passThrough],
            ['xor', passThrough],
            ['::', passThrough],
            ['{', passThrough],
            ['}', passThrough],
            ['\\(', passThrough],
            ['\\)', passThrough],
            ['\\[', passThrough],
            ['\\]', passThrough],
            
            ['var', passThrough],
            ['let', passThrough],
            ['final', passThrough],
            ['const', passThrough],

            ['static', passThrough],
            ['lazy', passThrough],

            ['public', passThrough],
            ['private', passThrough],
            ['readonly', passThrough],
            ['internal', passThrough],

            ['is', passThrough],

            ['function', passThrough],           
            ['func', passThrough],
            ['fn', passThrough],
            ['class', passThrough],
            ['struct', passThrough],
            ['interface', passThrough],
            ['enum', passThrough],
            ['typealias', passThrough],
            
            ['if', passThrough],
            ['for', passThrough],
            ['while', passThrough],
            
            ['[a-zA-Z_][a-zA-Z0-9_]*', passThrough, VSLTokenType.Identifier]
        ];
        tokenMatchers[VSLScope.Comment] = [
            ['/\\*', self => {
                self.variables.commentDepth++;
                self.begin(VSLScope.Comment);
            }],
            ['(?:[^/*]|\\*[^/]|/[^*])+', noop],
            ['\\*/', self => {
                self.variables.commentDepth--;
                if (!self.variables.commentDepth)
                    self.begin(VSLScope.Normal);
            }]
        ];
        super(tokenMatchers, VSLScope.Normal);
        this.variables = {
            commentDepth: 0
        };
    }
}