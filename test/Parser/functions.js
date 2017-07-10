import { vsl, valid, invalid } from '../hooks';

export default () => describe("Functions", () => {
    describe("Defining", () => {
        valid`func f() {}`;
        valid`func f() external(src)`;
        valid`func f() -> Void {}`;
        valid`func f() -> Void external(src)`;
        valid`func f(a: T) {}`;
        valid`func f(a: T = b) {}`;
        valid`func f(a: T = b) {}`;
    });

    describe("Calling", () => {
        valid`f()`;
        valid`f(1337)`;
        valid`f(goat: 1337)`;
        valid`f(a: f())`;
        valid`f(a: 9 + 10, b: 21)`;
    });
})
