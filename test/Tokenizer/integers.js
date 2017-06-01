import { VSLTokenType, compareTokenizer } from '../hooks';

export default () => {
    /** @test {VSLTokenType#Integer} */
    describe('integers', () => {
        it('should parse basic numerals', compareTokenizer(
            `123`,
            [['123', VSLTokenType.Integer]]
        ));
        
        it('should parse leading zeros', compareTokenizer(
            `0123`,
            [['0123', VSLTokenType.Integer]]
        ));
        
        it('should parse trailing zeros', compareTokenizer(
            `12300`,
            [['12300', VSLTokenType.Integer]]
        ));
        
        it('should support binary literals', compareTokenizer(
            `0b10101`,
            [['0b10101', VSLTokenType.Integer]]
        ));
    });
};