import { vsl, valid, invalid } from '../hooks';

export default () => describe("Classes", () => {
    valid`class A {}`;
    valid`class A: T {}`;

    // Constructors
    valid`class A {\ninit() {}\n}`;

    // Access modifiers
    valid`public class A {}`;
    valid`private class A {}`;

    describe('Annotations', () => {
        valid`@foo class A {}`;
        valid`@foo @bar class A {}`;
        valid`\n@foo\n@bar\nclass A {}`;
    });

    describe('Fields', () => {
        valid`class A { public let goat }`;
        valid`class A { public let goat = 1337 }`;
        valid`class A { public let goat: Int }`;
        valid`class A { public let goat: Int = 1337 }`;
        valid`class A { public var goat }`;
        valid`class A { public var goat = 1337 }`;
        valid`class A { public var goat: Int }`;
        valid`class A { public var goat: Int = 1337 }`;
        valid`class A { public static let goat }`;
        valid`class A { public static let goat = 1337 }`;
        valid`class A { public static let goat: Int }`;
        valid`class A { public static let goat: Int = 1337 }`;
        valid`class A { public static var goat }`;
        valid`class A { public static var goat = 1337 }`;
        valid`class A { public static var goat: Int }`;
        valid`class A { public static var goat: Int = 1337 }`;
    });

    describe('Generics', () => {
        valid`class A<T> {}`;
        valid`class A<T: U> {}`;
        valid`class A<T: U = V> {}`;
    });

    describe('Methods', () => {
        valid`class A {\nfunc f() {}\n}`;
        valid`class A {\npublic func f() {}\n}`;
        valid`class A {\nfunc f() external(g)\n}`;
        valid`class A {\npublic func f() {}\n}`;
        valid`class A {\nprivate func f() {}\n}`;
        valid`class A {\nfunc f() {}\nfunc g() {}\n}`;
    })
});
