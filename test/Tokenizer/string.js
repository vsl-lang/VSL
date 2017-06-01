import { VSLTokenType, compareTokenizer } from '../hooks';

export default () => {
    /** @test {VSLTokenType#String} */
    describe('string', () => {
        it('should parse strings', compareTokenizer(
            `"Hello, World!"`,
            [['Hello, World!', VSLTokenType.String]]
        ));
        
        it('should parse newlines', compareTokenizer(
            `"Hello\\nWorld!"`,
            [['Hello\nWorld!', VSLTokenType.String]]
        ));
        
        it('should parse tabs', compareTokenizer(
            `"Hello\\tWorld!"`,
            [['Hello\tWorld!', VSLTokenType.String]]
        ));
        
        it('should work with escapes (dq)', compareTokenizer(
            `"Hello\\"World!"`,
            [['Hello"World!', VSLTokenType.String]]
        ));
        
        it('should work with escapes (sq)', compareTokenizer(
            `'Hello\\'World!'`,
            [['Hello\'World!', VSLTokenType.String]]
        ));
        
        it('should work with escapes (\\)', compareTokenizer(
            `'Hello\\\\World!'`,
            [['Hello\\World!', VSLTokenType.String]]
        ));
    });
};