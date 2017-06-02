import { valid, invalid } from '../hooks';

export default () => describe("Expressions", () => {
    valid`1 + 1`;
    valid`1 - 1`;
    valid`1 * 1`;
    valid`1 / 1`;
    valid`1 ^ 1`;
    valid`1 & 1`;
    valid`1 | 1`;
    valid`1 ** 1`;
    
    valid`0..2`;
    valid`0...1`;
    
    valid`+1`; // numeric noop
    valid`-1`; // negation
    valid`*1`; // Spread opreator
    
    invalid`1 +`;
    invalid`/ 1`;
    invalid`1 -`;
})