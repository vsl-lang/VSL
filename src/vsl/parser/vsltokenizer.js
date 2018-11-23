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

function kw(name) {
    return new RegExp(`${name}\\b`);
}

// from https://github.com/iamakulov/unescape-js/blob/master/src/index.js

const jsEscapeRegex = /\\(?:u\{([0-9A-Fa-f]+)\}|([0bfnrtev'"\\]))/g;

const usualEscapeSequences = {
    '0': '\0',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'e': '\u001B',
    'v': '\v',
    '\'': '\'',
    '"': '"',
    '\\': '\\'
};

function unescapeString(_, match) {
    return match.slice(1, -1).replace(jsEscapeRegex, (_, unicodeSequence, escapeSequence) => {
        if (unicodeSequence)
            return String.fromCodePoint(parseInt(unicodeSequence, 16));
        if (escapeSequence)
            return usualEscapeSequences[escapeSequence];
    });
}

function unescapeByteSequence(_, match) {
    return match.slice(1, -1).replace(/\\x([a-fA-F0-9]{2})/g, (_, match) => {
        return String.fromCharCode(parseInt(match, 16));
    });
}

function parseBinaryInt(_, match) {
    return +match.replace(/_/g, '');
}

function parseHexInt(_, match) {
    return +match.replace(/_/g, '');
}

function nthmatch(matchNum) {
    return (a, b, n) => n[matchNum];
}

function parseBoolean(_, match) {
    return match === "true";
}

function singleLineComment(_, match) {
    return match.replace(/^\/+( (?! ))?/gm, '');
}

let tokenMatchers = Array(VSLScope.MAX);
tokenMatchers[VSLScope.Normal] = [
    [/(?:\s|\\\n)*[\r\n](?:\s|\\\n)*/, (self, match) => {
        return '\n';
    }],
    [/(?:\s|\\\n)+/, noop],
    [/\/\/[^\r\n]*/, singleLineComment, VSLTokenType.Comment],
    [/\/\*/, self => {
        self.variables.commentDepth++;
        self.begin(VSLScope.Comment);
    }, null],

    [/"(?:\\.|[^"\\])*"/, unescapeString, VSLTokenType.String],
    [/'(?:\\.|[^'\\])*'/, unescapeString, VSLTokenType.String],

    [/`(?:\\.|[^`\\])*`/, unescapeByteSequence, VSLTokenType.ByteSequence],

    [/import[ \t]+([A-Za-z_-][A-Za-z_0-9-]*)/, nthmatch(1), VSLTokenType.ImportStatement],
    [/\$+[0-9]+/, passThrough, VSLTokenType.SpecialArgument],
    [/\$[a-zA-Z_][a-zA-Z0-9_]*/, slice1, VSLTokenType.SpecialIdentifier],

    [/\.[0-9_]+/, strip_, VSLTokenType.Decimal],
    [/[0-9][0-9_]*\.[0-9_]+/, strip_, VSLTokenType.Decimal],

    [/0b([01](_[01])?)+/, parseBinaryInt, VSLTokenType.Integer],
    [/0x([0-9a-fA-F](_[0-9a-fA-F])?)+/, parseHexInt, VSLTokenType.Integer],

    [/[0-9][0-9_]*/, strip_, VSLTokenType.Integer],

    [/\/[^\/\*]([^\/\r\n]|\\[^\r\n])+\/[gmixc]*/, passThrough, VSLTokenType.Regex],
    [/true|false/, parseBoolean, VSLTokenType.Boolean],
    [/\.\.\./, passThrough],
    [/\.\./, passThrough],
    [/\./, passThrough],
    ['->', passThrough],
    ['=>', passThrough],
    ['~>', passThrough],
    [':>', passThrough],
    ['@', passThrough],
    ['::', passThrough],
    [';', passThrough],
    [':', passThrough],
    [',', passThrough],

    ['+=', passThrough],
    ['-=', passThrough],
    ['*=', passThrough],
    ['/=', passThrough],
    ['%=', passThrough],
    ['&=', passThrough],
    ['|=', passThrough],
    ['^=', passThrough],
    ['**=', passThrough],

    ['+', passThrough],
    ['-', passThrough],
    ['/', passThrough],
    ['\\', passThrough],
    ['%', passThrough],
    ['**', passThrough],
    ['*', passThrough],

    ['÷', ret('/')],
    ['×', ret('*')],
    ['≥', ret('>=')],
    ['≤', ret('<=')],
    ['≠', ret('!=')],
    ['¬', ret('!')],
    ['∧', ret('&&')],
    ['∨', ret('||')],
    ['⊕', ret('^')],
    ['⊤', ret('true')],
    ['⊥', ret('false')],

    ['<<=', passThrough],
    ['>>=', passThrough],
    ['>>>=', passThrough],
    ['>>>', passThrough],
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

    ['&&', passThrough],
    ['||', passThrough],

    ['!', passThrough],

    ['&', passThrough],
    ['|', passThrough],
    ['^', passThrough],

    ['~', passThrough],
    ['?', passThrough],
    ['::', passThrough],
    ['{', passThrough],
    ['}', passThrough],
    ['(', passThrough],
    [')', passThrough],
    ['[', passThrough],
    [']', passThrough],

    [kw('self'), passThrough],
    [kw('super'), passThrough],

    [kw('let'), passThrough],
    [kw('final'), passThrough],
    [kw('const'), passThrough],
    [kw('constant'), ret('const')],

    [kw('static'), passThrough],
    [kw('lazy'), passThrough],

    [kw('return'), passThrough],

    [kw('public'), passThrough],
    [kw('private'), passThrough],
    [kw('readonly'), passThrough],

    [kw('external'), passThrough],
    [kw('native'), passThrough],

    [kw('is'), passThrough],

    [kw('function'), passThrough],
    [kw('func'), ret('function')],
    [kw('fn'), ret('function')],
    [kw('class'), passThrough],
    [kw('struct'), passThrough],
    [kw('interface'), passThrough],
    [kw('enumeration'), ret('enum')],
    [kw('enum'), passThrough],
    [kw('typealias'), passThrough],

    [kw('init'), passThrough],
    [kw('deinit'), passThrough],

    [kw('if'), passThrough],
    [kw('else'), passThrough],
    [kw('for'), passThrough],
    [kw('while'), passThrough],

    [/[_\p{L}][_\p{L}\d]*/u, passThrough, VSLTokenType.Identifier]
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
tokenMatchers[VSLScope.DocumentationComment] = tokenMatchers[VSLScope.Comment];

/**
 * VSL-specific Tokenizer
 *
 * This defines tokens for VSL. For further information see {@link Tokenizer}
 */
export default class VSLTokenizer extends Tokenizer {
    /**
     * New VSL Tokenizer
     */
    constructor() {
        super(tokenMatchers, VSLScope.Normal);
        this.variables = {
            commentDepth: 0
        };
    }
}

VSLTokenizer.tokenMatchers = tokenMatchers;
