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
function ret (item) {
    return function transform () {
        return item;
    };
}

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


let tokenMatchers = Array(VSLScope.MAX);
tokenMatchers[VSLScope.Normal] = [
    [/(?:\s|\\\n)*[\r\n](?:\s|\\\n)*/, (self, match) => {
        self.newline(match.match(/(?:\r|\n|\r\n)/).length, match.match(/[ \t\v\f]*$/)[0].length - 1);
        return '\n';
    }],
    [/(?:\s|\\\n)+/, noop],
    [/\/\/[^\r\n]+/, noop],
    [/\/\*/, self => {
        self.variables.commentDepth++;
        self.begin(VSLScope.Comment);
    }, null],
    [/"(?:\\["bfnrt\/\\]|\u[a-fA-F0-9]{4}|[^"\\])*"/, unescapeString, VSLTokenType.String],
    [/'(?:\\['bfnrt\/\\]|\u[a-fA-F0-9]{4}|[^'\\])*'/, unescapeString, VSLTokenType.String],
    [/\$+[0-9]+/, passThrough, VSLTokenType.SpecialArgument],
    [/\$[a-zA-Z_][a-zA-Z0-9_]*/, slice1, VSLTokenType.SpecialIdentifier],
    [/\.[0-9_]+/, strip_, VSLTokenType.Decimal],
    [/[0-9][0-9_]*\.[0-9_]*/, strip_, VSLTokenType.Decimal],
    [/(?:[1-5]?[0-9]|6[0-2])b[0-9a-zA-Z_]*/, strip_, VSLTokenType.Integer],
    [/[0-9][0-9_]*/, strip_, VSLTokenType.Integer],
    [/\/[^\/\*]([^\/\r\n]|\\[^\r\n])+\/[gmixc]*/, passThrough, VSLTokenType.Regex],
    [/\.\.\./, passThrough],
    [/\.\./, passThrough],
    [/\./, passThrough],
    [/native\s*{/, self => {
        self.variables.nativeBlockData = "";
        self.variables.nativeBlockDepth = 1;
        self.begin(VSLScope.NativeBlock);
    }],
    ['->', passThrough],
    ['=>', passThrough],
    ['~>', passThrough],
    [':>', passThrough],
    ['@', passThrough],
    [';', passThrough],
    [':', passThrough],
    [',', passThrough],
    [/\+=/, passThrough],
    ['-=', passThrough],
    [/\*\*=/, passThrough],
    [/\*=/, passThrough],
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
    ['constant', ret('const')],

    ['static', passThrough],
    ['lazy', passThrough],

    ['public', passThrough],
    ['private', passThrough],
    ['readonly', passThrough],
    ['external', passThrough],

    ['is', passThrough],

    ['function', passThrough],           
    ['func', ret('function')],
    ['fn', ret('function')],
    ['class', passThrough],
    ['struct', passThrough],
    ['interface', passThrough],
    ['enumeration', passThrough],
    ['enum', ret('enumeration')],
    ['typealias', passThrough],

    ['init', passThrough],

    ['if', passThrough],
    ['else', passThrough],
    ['for', passThrough],
    ['while', passThrough],
    
    ['native', passThrough],
    
    [/[a-zA-Z_\u{00A8}\u{00AA}\u{00AD}\u{00AF}\u{00B2}-\u{00B5}\u{00B7}-\u{00BA}\u{00BC}-\u{00BE}\u{00C0}-\u{00D6}\u{00D8}-\u{00F6}\u{00F8}-\u{00FF}\u{0100}-\u{02FF}\u{0370}-\u{167F}\u{1681}-\u{180D}\u{180F}-\u{1DBF}\u{1E00}-\u{1FFF}\u{200B}-\u{200D}\u{202A}-\u{202E}\u{203F}-\u{2040}\u{2054}\u{2060}-\u{206F}\u{2070}-\u{20CF}\u{2100}-\u{218F}\u{2460}-\u{24FF}\u{2776}-\u{2793}\u{2C00}-\u{2DFF}\u{2E80}-\u{2FFF}\u{3004}-\u{3007}\u{3021}-\u{302F}\u{3031}-\u{303F}\u{3040}-\u{D7FF}\u{F900}-\u{FD3D}\u{FD40}-\u{FDCF}\u{FDF0}-\u{FE1F}\u{FE30}-\u{FE44}\u{FE47}-\u{FFFD}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E0000}-\u{EFFFD}][a-zA-Z0-9_\u{00A8}\u{00AA}\u{00AD}\u{00AF}\u{00B2}-\u{00B5}\u{00B7}-\u{00BA}\u{00BC}-\u{00BE}\u{00C0}-\u{00D6}\u{00D8}-\u{00F6}\u{00F8}-\u{00FF}\u{0100}-\u{02FF}\u{0370}-\u{167F}\u{1681}-\u{180D}\u{180F}-\u{1DBF}\u{1E00}-\u{1FFF}\u{200B}-\u{200D}\u{202A}-\u{202E}\u{203F}-\u{2040}\u{2054}\u{2060}-\u{206F}\u{2070}-\u{20CF}\u{2100}-\u{218F}\u{2460}-\u{24FF}\u{2776}-\u{2793}\u{2C00}-\u{2DFF}\u{2E80}-\u{2FFF}\u{3004}-\u{3007}\u{3021}-\u{302F}\u{3031}-\u{303F}\u{3040}-\u{D7FF}\u{F900}-\u{FD3D}\u{FD40}-\u{FDCF}\u{FDF0}-\u{FE1F}\u{FE30}-\u{FE44}\u{FE47}-\u{FFFD}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E0000}-\u{EFFFD}]*/u, passThrough, VSLTokenType.Identifier]
];
tokenMatchers[VSLScope.Comment] = [
    [/\/\*/, self => {
        self.variables.commentDepth++;
        self.begin(VSLScope.Comment);
    }],
    [/(?:[^\/*]|\*[^\/]|\/[^*])+/, noop],
    [/\*\//, self => {
        self.variables.commentDepth--;
        if (!self.variables.commentDepth)
            self.begin(VSLScope.Normal);
    }]
];
tokenMatchers[VSLScope.NativeBlock] = [
    [/{/, self => {
        self.variables.nativeBlockDepth++;
        self.variables.nativeBlockData += "{";
    }],
    [/}/, self => {
        self.variables.nativeBlockDepth--;
        if (self.variables.nativeBlockDepth <= 0) {
            self.begin(VSLScope.Normal);
            return self.variables.nativeBlockData;
        } else {
            self.variables.nativeBlockData += "}";
        }
    }, VSLTokenType.NativeBlock],
    [/./, (self, match) => {
        self.variables.nativeBlockData += match;
    }]
    
];
tokenMatchers[VSLScope.DocumentationComment] = tokenMatchers[VSLScope.Comment];

/**
 * VSL-specific Tokenizer
 *
 * This defines tokens for VSL. For further information see {@link Tokenizer}
 */
export default class VSLTokenizer extends Tokenizer {
    constructor () {
        super(tokenMatchers, VSLScope.Normal);
        this.variables = {
            commentDepth: 0,
            nativeBlockDepth: 0,
            nativeBlockData: ""
        };
    }
}

VSLTokenizer.tokenMatchers = tokenMatchers;
