import { VSLTokenType, compareTokenizer } from '../hooks';

export default () => {
    /** @test {VSLTokenType#Decimal} */
    describe('floats', () => {
        it('should parse basic floats', compareTokenizer(
            `123.123`,
            [['123.123', VSLTokenType.Decimal]]
        ));
        
        it('should parse trailing zeros', compareTokenizer(
            `123.1230`,
            [['123.1230', VSLTokenType.Integer]]
        ));
        
        it('should work with no integer', compareTokenizer(
            `.123`,
            [['.123', VSLTokenType.Integer]]
        ));
    });
};