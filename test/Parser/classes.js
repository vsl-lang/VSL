import { vsl, valid, invalid } from '../hooks';

export default () => describe("Classes", () => {
    valid`class A {}`;
    valid`class A: T {}`;
    
    // Access modifiers
    valid`public class A {}`;
    valid`private class A {}`;

    describe('Annotations', () => {
        valid`@foo class A { }`;
        valid`@foo @bar class A { }`;
        valid`
            @foo
            @bar
            class A {}`
    });

    describe('Generics', () => {
        valid`class A<T> {}`;
        valid`class A<T: U> {}`;
        valid`class A<T: U = V> {}`;
    });

    describe('Methods', () => {
        valid`class A {
            func f() {}
        }`;
        
        valid`class A {
            public func f() {}
        }`;
        
        valid`class A {
            func f() internal(g)
        }`;
        
        valid`class A {
            public func f() {}
        }`;
        
        valid`class A {
            private func f() {}
        }`;
        
        valid`class A {
            func f() {}
            func g() {}
        }`;
    })
});
