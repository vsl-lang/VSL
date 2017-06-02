import { vsl, valid, invalid } from '../hooks';

export default () => describe("Whatever", () => {
    valid`? + ?`;
    valid`?`;
    valid`??.asdf`;
})