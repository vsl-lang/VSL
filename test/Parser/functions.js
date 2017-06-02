import { vsl, valid, invalid } from '../hooks';

export default () => describe("Functions", () => {
    valid`func f() {}`;
    valid`func f() internal(src)`;
    valid`func f() -> Void {}`;
    valid`func f() -> Void internal(src)`;
    valid`func f(a: T) {}`;
    valid`func f(a: T = b) {}`;
    valid`func f(a: T = b) {}`;
})