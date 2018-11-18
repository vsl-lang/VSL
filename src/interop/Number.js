import VSLType from './VSLType';
import { endianness } from 'os';

const currentEndianness = endianness();

export default class Number extends VSLType {

    /**
     * Creates number
     * @param {Buffer} data
     * @param {Object} [opts={}]
     * @param {boolean} opts.signed
     */
    constructor(data, { signed } = {}) {
        super(data);

        /**
         * If signed int
         * @type {boolean}
         * @readonly
         */
        this.signed = signed;
    }

    /**
     * Converts from a JS number.
     * @param {number} number - JS number object
     * @param {Object} [options={}] - Options for number
     * @param {number} [width=64] - width will be determined based on current
     *                            sys constraints if not passed.
     * @param {boolean} [signed=true] - If signed int
     * @return {Number}
     * @throws {TypeError} if the width is an invalid value.
     */
    static from(number, { width = 64, signed = true } = {}) {
        if (width !== 64 && width !== 32 && width !== 16) {
            throw new TypeError('numerical width must be 64, 32, or 16');
        }

        const integerSize = width >> 3;
        const buffer = Buffer.alloc(integerSize);
        const functionName = `write${signed ? '': 'U'}Int${currentEndianness}`;
        buffer[functionName](number, 0, integerSize);

        return new Number(buffer, { signed: signed });
    }

    /**
     * Converts to JS number
     * @return {number}
     */
    toNumber() {
        const functionName = `read${this.signed ? '': 'U'}Int${currentEndianness}`;
        return this.data[functionName](0);
    }
}
