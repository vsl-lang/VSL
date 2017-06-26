import { vsl, valid, invalid } from '../hooks';

export default () => describe("Interfaces", () => {
    valid`interface A {}`;
    valid`interface A: T {}`;

    // Access modifiers
    valid`public interface A {}`;
    valid`private interface A {}`;

    describe('Annotations', () => {
        valid`@foo interface A {}`;
        valid`@foo @bar interface A {}`;
        valid`\n@foo\n@bar\ninterface A {}`;
    });

    describe('Generics', () => {
        valid`interface A<T> {}`;
        valid`interface A<T: U> {}`;
        valid`interface A<T: U = V> {}`;
    });

    describe('Methods', () => {
        valid`interface A {\nfunc f() {}\n}`;
        valid`interface A {\nfunc f() external(g)\n}`;
        valid`interface A {\npublic func f() {}\n}`;
        valid`interface A {\nprivate func f() {}\n}`;
        valid`interface A {\nfunc f() {}\nfunc g() {}\n}`;
        valid`interface A {\nfunc f()\n}`;
        valid`interface A {\npublic func f()\n}`;
        valid`interface A {\nprivate func f()\n}`;
        valid`interface A {\nfunc f()\nfunc g()\n}`;
    })
});
