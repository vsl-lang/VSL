import { VSLTokenType, compareTokenizer } from '../hooks';

function operatorHook(op) {
    return compareTokenizer(
        `1 ${op} 1`,
        [['1', 0], { value: op }, ['1', 0]]
    );
}

export default () => {
    describe('Operators', () => {
        it('should work with +', operatorHook("+"))
        it('should work with -', operatorHook("-"))
        it('should work with *', operatorHook("*"))
        it('should work with /', operatorHook("/"))
        it('should work with %', operatorHook("%"))
        it('should work with **', operatorHook("**"))
        it('should work with ^', operatorHook("^"))
        it('should work with &', operatorHook("&"))
        it('should work with |', operatorHook("|"))
    });
}