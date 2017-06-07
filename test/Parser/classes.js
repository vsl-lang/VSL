import { vsl, valid, invalid } from '../hooks';

export default () => describe("Classes", () => {
    valid`class A {}`;
    valid`class A: T {}`;
    valid`interface A {}`;
    valid`interface A: T {}`;
    
    // Access modifiers
    valid`public class A {}`;
    valid`private class A {}`;
    valid`public interface A {}`;
    valid`private interface A {}`;

    describe('Annotations', () => {
        valid`@foo class A { }`;
        valid`@foo @bar class A { }`;
        valid`
            @foo
            @bar
            class A {}`
        valid`@foo interface A { }`;
        valid`@foo @bar interface A { }`;
        valid`
            @foo
            @bar
            interface A {}`
    });

    describe('Generics', () => {
        valid`class A<T> {}`;
        valid`class A<T: U> {}`;
        valid`class A<T: U = V> {}`;
        valid`interface A<T> {}`;
        valid`interface A<T: U> {}`;
        valid`interface A<T: U = V> {}`;
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
        
        invalid`interface A {
            func f() {}
        }`;
        
        invalid`interface A {
            public func f() {}
        }`;
        
        invalid`interface A {
            func f() internal(g)
        }`;
        
        invalid`interface A {
            public func f() {}
        }`;
        
        invalid`interface A {
            private func f() {}
        }`;
        
        invalid`interface A {
            func f() {}
            func g() {}
        }`;
        
        valid`interface A {
            func f()
        }`;
        
        valid`interface A {
            public func f()
        }`;
        
        valid`interface A {
            public func f()
        }`;
        
        valid`interface A {
            private func f()
        }`;
        
        valid`interface A {
            func f()
            func g()
        }`;
    })
})
