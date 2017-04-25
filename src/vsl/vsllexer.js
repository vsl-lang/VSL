'use strict';

import Lexer from './lexer';

function noop () {}
function passThrough (_, match) { return match; }

export const VSLScope = {
    Normal: 1 << 0,
    Comment: 1 << 1,
    SingleQuotedString: 1 << 2,
    DoubleQuotedString: 1 << 3
};

export const VSLTokenType = {
    Integer: 0,
    Decimal: 1,
    String: 2,
    Regex: 3,
    SpecialArgument: 4,
    SpecialLoop: 5,
    SpecialIdentifier: 6,
    Identifier: 7
};

export class VSLLexer extends Lexer {
    constructor () {
        super([
            ['[\\s\r\n]+',  noop],
            ['//[^\r\n]+', noop],
            ['/\\*', self => {
                self.variables.commentDepth++;
                self.begin(VSLScope.Comment);
            }, null, VSLScope.Normal | VSLScope.Comment],
            ['(?:[^/*]|\\*[^/]|/[^*])+', noop, null, VSLScope.Comment],
            ['\\*/', self => {
                self.variables.commentDepth--;
                if (!self.variables.commentDepth)
                    self.begin(VSLScope.Normal);
            }, null, VSLScope.Comment],
            ['"', self => {
                self.begin(VSLScope.DoubleQuotedString);
            }],
            ['\'', self => {
                self.begin(VSLScope.SingleQuotedString);
            }],
            ['([^\\\\"]|\\\\.)*', passThrough, VSLTokenType.String, VSLScope.DoubleQuotedString], // we have no escapes right?
            ['([^\\\\\']|\\\\.)*', passThrough, VSLTokenType.String, VSLScope.SingleQuotedString],
            ['"', self => { self.begin(VSLScope.Normal); }, null, VSLScope.DoubleQuotedString],
            ['\'', self => { self.begin(VSLScope.Normal); }, null, VSLScope.SingleQuotedString],
            ['\\$+[0-9]+', passThrough, VSLTokenType.SpecialArgument],
            ['\\$+_[0-9]+', passThrough, VSLTokenType.SpecialLoop],
            ['\\$?[a-zA-Z_][a-zA-Z0-9_]*', passThrough, VSLTokenType.SpecialIdentifier],
            ['-?\\.[0-9_]+', passThrough, VSLTokenType.Integer],
            ['-?[0-9][0-9_]*\\.?[0-9_]*', passThrough, VSLTokenType.Decimal],
            ['/[^\/\*]([^\\/\r\n]|\\[^\r\n])+/[gmixc]*', passThrough, VSLTokenType.Regex],
            ['\\.\\.', passThrough],
            ['\\.', passThrough],
            [';', passThrough],
            [':', passThrough],
            [',', passThrough],
            ['\\+=', passThrough],
            ['-=', passThrough],
            ['\\*=', passThrough],
            ['/=', passThrough],
            ['%=', passThrough],
            ['\\*\\*=', passThrough],
            ['\\+', passThrough],
            ['-', passThrough],
            ['\\*', passThrough],
            ['/', passThrough],
            ['%', passThrough],
            ['\\*\\*', passThrough],
            ['<<=', passThrough],
            ['>>=', passThrough],
            ['<<', passThrough],
            ['>>', passThrough],
            ['==', passThrough],
            ['!=', passThrough],
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
            ['&', passThrough],
            ['|', passThrough],
            ['~', passThrough],
            ['^', passThrough],
            ['&&', passThrough],
            ['||', passThrough],
            ['!', passThrough],
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
            ['while', passThrough]
        ], VSLScope.Normal)
        this.variables = {
            commentDepth: 0
        };
    }
}