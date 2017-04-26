import Tokenizer from './tokenizer';
import VSLScope from './vslscope';
import VSLTokenType from './vsltokentype'

function noop () {}
function passThrough (_, match) { return match; }
function strip (character) {
    return function transform (_, match) {
        return match.replace(character, '');
    }
}
const strip_ = strip('_');
function slice (index) {
    return function transform (_, match) {
        return match.slice(index);
    }
}
const slice1 = slice(1);

export default class VSLTokenizer extends Tokenizer {
    constructor () {
        super({
                [VSLScope.Normal]: [
                ['(?:\\s|\\\\\\n)*[\r\n](?:\\s|\\\\\\n)*', () => '\n'],
                ['(?:\\s|\\\\\\n)+', noop],//() => ' '],
                ['//[^\r\n]+', noop],
                ['/\\*', self => {
                    self.variables.commentDepth++;
                    self.begin(VSLScope.Comment);
                }, null],
                ['"', self => {
                    self.begin(VSLScope.DoubleQuotedString);
                }],
                ['\'', self => {
                    self.begin(VSLScope.SingleQuotedString);
                }],
                ['\\$+[0-9]+', passThrough, VSLTokenType.SpecialArgument],
                ['\\$+_[0-9]+', passThrough, VSLTokenType.SpecialLoop],
                ['\\$[a-zA-Z_][a-zA-Z0-9_]*', slice1, VSLTokenType.SpecialIdentifier],
                ['\\.[0-9_]+', strip_, VSLTokenType.Decimal],
                ['[0-9][0-9_]*\\.[0-9_]+', strip_, VSLTokenType.Decimal],
                ['(?:[1-5]?[0-9]|6[0-2])b[0-9a-zA-Z_]*', strip_, VSLTokenType.Integer],
                ['[0-9][0-9_]*', strip_, VSLTokenType.Integer],
                ['/[^\/\*]([^\\/\r\n]|\\[^\r\n])+/[gmixc]*', passThrough, VSLTokenType.Regex],
                ['\\.\\.', passThrough],
                ['\\.', passThrough],
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
                ['|=', passThrough],
                ['^=', passThrough],
                ['&&', passThrough],
                ['||', passThrough],
                ['!', passThrough],
                ['&', passThrough],
                ['|', passThrough],
                ['~', passThrough],
                ['^', passThrough],
                ['and', passThrough],
                ['or', passThrough],
                ['not', passThrough],
                ['xor', passThrough],
                ['::', passThrough],
                ['->', passThrough],
                [':>', passThrough],
                ['{', passThrough],
                ['}', passThrough],
                ['\\(', passThrough],
                ['\\)', passThrough],
                ['\\[', passThrough],
                ['\\]', passThrough],
                ['=>', passThrough],
                ['var', passThrough],
                ['let', passThrough],
                ['final', passThrough],
                ['const', passThrough],
                ['is', passThrough],
                ['issub', passThrough],
                ['isinstance', passThrough],
                ['function', passThrough],
                ['fn', passThrough],
                ['class', passThrough],
                ['cls', passThrough],
                ['interface', passThrough],
                ['itf', passThrough],
                ['trait', passThrough],
                ['trt', passThrough],
                ['enum', passThrough],
                ['if', passThrough],
                ['for', passThrough],
                ['while', passThrough],
                ['[a-zA-Z_][a-zA-Z0-9_]*', passThrough, VSLTokenType.Identifier]
            ],
            [VSLScope.Comment]: [
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
            ],
            [VSLScope.SingleQuotedString]: [
                ['([^\\\\\']|\\\\.)*', passThrough, VSLTokenType.String],
                ['\'', self => { self.begin(VSLScope.Normal); }]
            ],
            [VSLScope.DoubleQuotedString]: [
                ['([^\\\\"]|\\\\.)*', passThrough, VSLTokenType.String], //TODO: test with escapes
                ['"', self => { self.begin(VSLScope.Normal); }]
            ]
        }, VSLScope.Normal);
        this.variables = {
            commentDepth: 0
        };
    }
}