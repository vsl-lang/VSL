import { vsl, regenerate } from '../hooks';

export default () => describe("Expression", () => {
    regenerate(
        vsl`1 + 1`,
        `(1 + 1)`
    );
    
    regenerate(
        vsl`1 + 1 * 2`,
        `(1 + (1 * 2))`
    );
    
    regenerate(
        vsl`1 + 2 + 3`,
        `((1 + 2) + 3)`
    );
    
    regenerate(
        vsl`1 * 2 / 3`,
        `((1 * 2) / 3)`
    );
    
    regenerate(
        vsl`1 ** 2 ** 3`,
        `(1 ** (2 ** 3))`
    );
    
    describe("Properties", () => {
        regenerate(
            vsl`a.b`,
            `(a).b`
        );
        
        regenerate(
            vsl`a.b.c`,
            `((a).b).c`
        );
        
        regenerate(
            vsl`a.b.c.d`,
            `(((a).b).c).d`
        );
        
        regenerate(
            vsl`f(1)`,
            `f(1)`
        );
        
        regenerate(
            vsl`f(1, 2)`,
            `f(1, 2)`
        );
        
        regenerate(
            vsl`f(a: 1)`,
            `f(a: 1)`
        );
        
        regenerate(
            vsl`x.f(a: 1)`,
            `(x).f(a: 1)`
        );
        
        regenerate(
            vsl`x.f(a: 1).y`,
            `((x).f(a: 1)).y`
        );
    })
});