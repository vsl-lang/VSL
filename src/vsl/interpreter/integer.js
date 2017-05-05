//TODO: document
import integer_asm_gen from './integer_asm';

//from https://github.com/vibornoff/asmcrypto.js/blob/master/src/bignum/bignum.js

let decode = typeof TextDecoder !== 'undefined' ? //browser
    (function () {
        let decoder = new TextDecoder('latin1');
        return function (buffer) {
            return decoder.decode(new DataView(buffer));
        }
    }) : //node
    function (buffer) {
        return Buffer.from(buffer.buffer).toString('latin1');
    };

let buffer = new ArrayBuffer(0x100000),
    integer_asm = integer_asm_gen({ Uint32Array, Math }, null, buffer);

export default class Integer {
    //TODO: promote if > 1e14
    
    constructor (value: string) {
        //TODO
    }
    
    static fromInt (int: number) {
        let result = new Integer();
        result.limbs = new Uint32Array([int]);
        result.sign = int < 0 ? -1 : 1;
        return result;
    }
    
    compare (other) {
        let sign = this.sign,
            other_sign = other.sign;

        if (sign > other_sign)
            return 1;

        if (sign < other_sign)
            return -1;

        let limbs = this.limbs,
            limbs_length = this.limbs.length,
            other_limbs = other.limbs,
            other_limbs_length = other.limbs.length;

        buffer.set(limbs, 0);
        buffer.set(other_limbs, limbs_length);
        return sign * integer_asm.compare(0, limbs_length << 2, limbs_length << 2, other_limbs_length << 2);
    }
    
    toString () {
        //TODO: get thing, size is Uint8Array(limbs * 10)
        //return decode(buffer);
    }
}