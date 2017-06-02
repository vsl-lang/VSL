import { vsl, valid, invalid } from '../hooks';

export default () => describe("Comments", () => {
    valid`//foobar`;
    // Nested comments
    valid`/*asdjaioafowfh/**/awofw*/`;
    valid`class /*asdjaioafowfh/**/awofw*/ A /*/**/*/ { /*/**/*/ }`;
})