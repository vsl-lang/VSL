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
    
    describe("Properties", () => {
        valid`a`;
        valid`a1`;
        valid`_a`;
        
        invalid`1a`;
        
        valid`a.b`;
        valid`a.b(c)`;
        valid`a.b(c).d`;
        valid`a.b[c]`;
        valid`a.b[c].d`;
        
        valid`a?.b`;
        valid`a?`;
        valid`a?.b?`;
        
        valid`a?(c)`;
        valid`a?[c]`;
        
        valid`a[c]?.d`;
        valid`a[c]?[d]`;
        
        invalid `a[c]?d`
    });
});