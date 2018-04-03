import Tokenizer from './tokenizer';
import VSLScope from './vslscope';
import VSLTokenType from './vsltokentype';
import VSLTokenizer from './vsltokenizer';

function passThrough (_, match) { return match; }
function slice (start, end) {
    return function transform (_, match) {
        return match.slice(start, end);
    };
}

let tokenMatchers = Array(VSLScope.MAX);
tokenMatchers[VSLScope.Normal] = [
    ['/\\**', self => {
        self.variables.commentDepth++;
        self.begin(VSLScope.DocumentationComment);
    }, null],
    ['///[^\r\n]+', slice(3),  VSLTokenType.Documentation]
].concat(VSLTokenizer.tokenMatchers);
tokenMatchers[VSLScope.Comment] = VSLTokenizer.tokenMatchers[VSLScope.Comment];
tokenMatchers[VSLScope.DocumentationComment] = [
    ['/\\*', (self, match) => {
        self.variables.commentDepth++;
        self.begin(VSLScope.Comment);
        return match;
    }, VSLTokenType.Documentation],
    ['(?:[^/*]|\\*[^/]|/[^*])+', passThrough, VSLTokenType.Documentation],
    ['\\*/', (self, match) => {
        self.variables.commentDepth--;
        if (!self.variables.commentDepth)
            self.begin(VSLScope.Normal);
        return match;
    }, VSLTokenType.Documentation]
];

/**
 * VSL-specific Tokenizer
 *
 * This defines tokens for VSL. For further information see {@link Tokenizer}
 */
export default class VSLDocumentationTokenizer extends Tokenizer {
    constructor () {
        super(tokenMatchers, VSLScope.Normal);
        this.variables = {
            commentDepth: 0
        };
    }
}
