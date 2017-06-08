import { vsl, valid, invalid } from '../hooks';

export default () => describe("Interfaces", () => {
    valid`interface A {}`;
    valid`interface A: T {}`;

    // Access modifiers
    valid`public interface A {}`;
    valid`private interface A {}`;

    describe('Annotations', () => {
        valid`@foo interface A { }`;
        valid`@foo @bar interface A { }`;
        valid`
            @foo
            @bar
            interface A {}`
    });

    describe('Generics', () => {
        valid`interface A<T> {}`;
        valid`interface A<T: U> {}`;
        valid`interface A<T: U = V> {}`;
    });

    describe('Methods', () => {
        valid`interface A {
            func f() {}
        }`;
 
        valid`interface A {
            func f() internal(g)
        }`;

        valid`interface A {
            public func f() {}
        }`;

        valid`interface A {
            private func f() {}
        }`;

        valid`interface A {
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
            private func f()
        }`;

        valid`interface A {
            func f()
            func g()
        }`;
    })
});
