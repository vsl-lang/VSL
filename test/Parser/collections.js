import { valid, invalid } from '../hooks';

export default () => describe("Collections", () => {
    describe("Array", () => {
        valid`[]`;
        valid`[ ]`;
        valid`[\n]`;
        
        valid`[1]`;
        valid`[\n1\n]`;
        
        valid`[1, 2]`;
        valid`[1\n,\n2]`;
    });
    
    describe("Tuple", () => {
        valid`()`;
        valid`( )`;
        valid`(\n)`;
        
        valid`(1,)`;
        valid`(\n1\n,\n)`;
        
        valid`(1, 2)`;
        valid`(1\n,\n2)`;
    })
    
    describe("Dictionary", () => {
        valid`[:]`;
        valid`[\n:\n]`;
        
        valid`['K': 1]`;
        valid`[\n'K'\n:\n1\n]`;
        
        valid`["A" + "B": 1]`;
        valid`["AB": 1 + 1]`;
        
        valid`["AB": 1 + 1, "A" + "C": 1 + 1]`;
    })
})