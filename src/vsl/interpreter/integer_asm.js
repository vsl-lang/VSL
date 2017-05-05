/**
 * Module for basic Integer operations.
 * All lengths and offsets are multiples of four, aligned to 32 bytes.
 */
/*
``.replace(/HEAP32/g, 'heap')
    .replace(/lA/g, 'self_length')
    .replace(/lB/g, 'other_length')
    .replace(/lR/g, 'result_length')
    .replace(/A/g, 'self')
    .replace(/B/g, 'other')
    .replace(/R([a-z])/g, 'result_$1')
    .replace(/R/g, 'result')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')')
    .replace(/([^ ])([-+|])([^ ])/g, '$1 $2 $3')
    .replace(/([^ ])([-+|])([^ ])/g, '$1 $2 $3')
    .replace(/([^ ])>>([^ ])/g, '$1 >> $2')
    .replace(/([^a-z])t([^a-z])/g, '$1lower$2')
    .replace(/([^a-z])r([^a-z])/g, '$1upper$2')
    .replace(/([^a-z])c([^a-z])/g, '$1carry$2');
*/

//TODO: double dabble, special case methods for radices 2, 4, 8, 16, 32
//TODO: karatsuba
//TODO: export default
function integer_asm_gen (stdlib, foreign, buffer) {
    'use asm';
    
    var heap = new stdlib.Uint32selfrray(buffer),
        stack_pointer = 0,
        imul = stdlib.Math.imul;
    
    ///////////////////////
    /// Stack allocator ///
    ///////////////////////
    
    /**
     * Clears heap.
     */
    function sreset () {
        stack_pointer = 0;
    }
    
    /**
     * Allocates new memory at end of heap.
     * 
     * @param {number} length The amount of memory to allocate.
     * @return The offset of the new end of the heap.
     */
    function salloc (length) {
        length = length | 0;
        stack_pointer = stack_pointer + ((length + 31) & -32) | 0;
        return stack_pointer | 0;
    }
    
    /**
     * Frees memory at end of heap.
     * 
     * @param {number} length The amount of memory to free.
     */
    function sfree (length) {
        length = length | 0;
        stack_pointer = stack_pointer - ((length + 31) & -32) | 0;
    }
    
    ///////////////
    /// Utility ///
    ///////////////
    
    /**
     * Copies memory.
     * 
     * @param {number} length The amount of memory to free.
     * @param {number} source The offset of the source.
     * @param {number} destination The integer offset of the destination.
     */
    function copy (length, source, destination) {
        length = length | 0;
        source = source | 0;
        destination = destination | 0;

        var i = 0;
        
        //TODO: add source > destination back if needed (ask vibornoff)
        for (; (i | 0) < (length | 0); i = (i + 4) | 0)
            heap[(destination + i) >> 2] = heap[(source + i) >> 2];
    }
    
    /**
     * Zeroes memory.
     * 
     * @param {number} length The length to zero.
     * @param {number} start The offset at which to start zeroing.
     */
    function zero (length, start) {
        length = length | 0;
        start = start | 0;

        var i = 0;

        for (; (i | 0) < (length | 0); i = (i + 4) | 0)
            heap[(start + i) >> 2] = 0;
    }
    
    //////////////////
    /// Arithmetic ///
    //////////////////
    
    /**
     * Negates a number.
     * 
     * @param {number} source The offset of the source.
     * @param {number} destination The offset of the destination.
     * @param {number} destination_length Length of the number.
     */
    function negate (source, destination, length) {
        source = source | 0;
        destination = destination | 0;
        length = length | 0;
        
        var inverted = 0, lower = 0, upper = 0, carry = 1, i = 0;

        // in asm this is where the overflow flag would come in
        for (; (i | 0) < (length | 0); i = (i + 4) | 0) {
            inverted = ~heap[(source + i) >> 2];
            lower = (inverted & 0xFFFF) + carry | 0;
            upper = (inverted >>> 16) + (lower >>> 16) | 0;
            heap[(destination + i) >> 2] = (upper << 16) | (lower & 0xFFFF);
            carry = upper >>> 16;
        }
    }

    /**
     * Compares a number to another.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} other The offset of the second number.
     * @param {number} other_length The length of the second number.
     * @return {number} 1 if the first number is greater, -1 if it is lesser, else 0.
     */
    function compare (self, self_length, other, other_length) {
        self = self | 0;
        self_length = self_length | 0;
        other = other | 0;
        other_length = other_length | 0;

        var a = 0, b = 0, i = 0;

        if ((self_length | 0) > (other_length | 0))
            for ( i = (self_length - 4) | 0; (i | 0) >= (other_length | 0); i = (i - 4) | 0) {
                if (heap[(self + i) >> 2] | 0)
                    return 1;
            }
        else
            for (i = (other_length - 4) | 0; (i | 0) >= (self_length | 0); i = (i - 4) | 0)
                if (heap[(other + i) >> 2] | 0)
                    return -1;

        for (; (i | 0) >= 0; i = (i-4) | 0) {
            a = heap[(self + i) >> 2] | 0, b = heap[(other + i) >> 2] | 0;
            if (a >>> 0 < b >>> 0)
                return -1;
            if (a >>> 0 > b >>> 0)
                return 1;
        }

        return 0;
    }
    
    /**
     * Returns the number of nonzero limbs.
     * 
     * @param {number} start The offset of the number.
     * @param {number} length The length of the number.
     * @return The number of nonzero limbs.
     */
    function limbs (start, length) {
        start = start | 0;
        length = length | 0;

        var i = 0;

        for (i = (length - 4) | 0; (i | 0) >= 0; i = (i - 4) | 0)
            if (heap[(start + i) >> 2] | 0)
                return (i + 4) | 0;

        return 0;
    }
    
    /**
     * Adds two numbers.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} other The offset of the second number.
     * @param {number} other_length The length of the second number.
     * @param {number} result The offset of the result.
     * @param {number} result_length The length of the result.
     */
    function add (self, self_length, other, other_length, result, result_length) {
        self = self | 0;
        self_length = self_length | 0;
        other = other | 0;
        other_length = other_length | 0;
        result = result | 0;
        result_length = result_length | 0;

        var a = 0, b = 0, carry = 0, lower = 0, upper = 0, i = 0;

        if ( (self_length | 0) < (other_length | 0) ) {
            lower = self, self = other, other = lower;
            lower = self_length, self_length = other_length, other_length = lower;
        }

        if ((result_length | 0) <= 0)
            result_length = (self_length + 4) | 0;

        if ((result_length | 0) < (other_length | 0))
            self_length = other_length = result_length;

        for (; (i | 0) < (other_length | 0); i = (i + 4) | 0) {
            a = heap[(self + i) >> 2] | 0;
            b = heap[(other + i) >> 2] | 0;
            lower = ( (a & 0xffff) + (b & 0xffff) | 0 ) + carry | 0;
            upper = ( (a >>> 16) + (b >>> 16) | 0 ) + (lower >>> 16) | 0;
            heap[(result + i) >> 2] = (upper << 16) | (lower & 0xffff);
            carry = upper >>> 16;
        }

        for (; (i | 0) < (self_length | 0); i = (i + 4) | 0) {
            a = heap[(self + i) >> 2] | 0;
            lower = (a & 0xffff) + carry | 0;
            upper = (a >>> 16) + (lower >>> 16) | 0;
            heap[(result + i) >> 2] = (upper << 16) | (lower & 0xffff);
            carry = upper >>> 16;
        }

        for (; (i | 0) < (result_length | 0); i = (i + 4) | 0) {
            heap[(result + i) >> 2] = carry | 0;
            carry = 0;
        }

        return carry | 0;
    }

    /**
     * Subtracts two numbers.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} other The offset of the second number.
     * @param {number} other_length The length of the second number.
     * @param {number} result The offset of the result.
     * @param {number} result_length The length of the result.
     */
    function subtract (self, self_length, B, other_length, result, result_length) {
        self = self | 0;
        self_length = self_length | 0;
        B = B | 0;
        other_length = other_length | 0;
        result = result | 0;
        result_length = result_length | 0;

        var a = 0, b = 0, carry = 0, lower = 0, upper = 0, i = 0;

        if ((result_length | 0) <= 0)
            result_length = (self_length | 0) > (other_length | 0) ? self_length + 4|0 : other_length + 4|0;

        if ((result_length | 0) < (self_length | 0))
            self_length = result_length;

        if ((result_length | 0) < (other_length | 0))
            other_length = result_length;

        if ((self_length | 0) < (other_length | 0)) {
            for (; (i | 0) < (self_length | 0); i = (i + 4) | 0) {
                a = heap[(self + i) >> 2] | 0;
                b = heap[(B + i) >> 2] | 0;
                lower = ((a & 0xffff) - (b & 0xffff) | 0) + carry | 0;
                upper = ((a >>> 16) - (b >>> 16) | 0) + (lower >> 16) | 0;
                heap[(result + i) >> 2] = (lower & 0xffff) | (upper << 16);
                carry = upper >> 16;
            }

            for (; (i | 0) < (other_length | 0); i = (i + 4) | 0) {
                b = heap[(B + i) >> 2] | 0;
                lower = carry - (b & 0xffff) | 0;
                upper = (lower >> 16) - (b >>> 16) | 0;
                heap[(result + i) >> 2] = (lower & 0xffff) | (upper << 16);
                carry = upper >> 16;
            }
        }
        else {
            for (; (i | 0) < (other_length | 0); i = (i + 4) | 0) {
                a = heap[(self + i) >> 2] | 0;
                b = heap[(B + i) >> 2] | 0;
                lower = ((a & 0xffff) - (b & 0xffff) | 0) + carry | 0;
                upper = ((a >>> 16) - (b >>> 16) | 0) + (lower >> 16) | 0;
                heap[(result + i) >> 2] = (lower & 0xffff) | (upper << 16);
                carry = upper >> 16;
            }

            for (; (i | 0) < (self_length | 0); i = (i + 4) | 0) {
                a = heap[(self + i) >> 2] | 0;
                lower = (a & 0xffff) + carry | 0;
                upper = (a >>> 16) + (lower >> 16) | 0;
                heap[(result + i) >> 2] = (lower & 0xffff) | (upper << 16);
                carry = upper >> 16;
            }
        }

        for (; (i | 0) < (result_length | 0); i = (i + 4) | 0) {
            heap[(result + i) >> 2] = carry | 0;
        }

        return carry | 0;
    }
    
    //TODO: rewrite to GMP style not asmcrypto style, add karatsuba and maybe a few toom, make this call fastest algorithm for other_length
    /**
     * Multiplies two numbers.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} other The offset of the second number.
     * @param {number} other_length The length of the second number.
     * @param {number} result The offset of the result.
     * @param {number} result_length The length of the result.
     */
    function multiply (self, self_length, other, other_length, result, result_length) {
        self = self | 0;
        self_length = self_length | 0;
        other = other | 0;
        other_length = other_length | 0;
        result = result | 0;
        result_length = result_length | 0;

        var al0 = 0, al1 = 0, al2 = 0, al3 = 0, al4 = 0, al5 = 0, al6 = 0, al7 = 0, ah0 = 0, ah1 = 0, ah2 = 0, ah3 = 0, ah4 = 0, ah5 = 0, ah6 = 0, ah7 = 0,
            bl0 = 0, bl1 = 0, bl2 = 0, bl3 = 0, bl4 = 0, bl5 = 0, bl6 = 0, bl7 = 0, bh0 = 0, bh1 = 0, bh2 = 0, bh3 = 0, bh4 = 0, bh5 = 0, bh6 = 0, bh7 = 0,
            upper0 = 0, upper1 = 0, upper2 = 0, upper3 = 0, upper4 = 0, upper5 = 0, upper6 = 0, upper7 = 0, upper8 = 0, upper9 = 0, upper10 = 0, upper11 = 0, upper12 = 0, upper13 = 0, upper14 = 0, upper15 = 0,
            u = 0, v = 0, w = 0, m = 0,
            i = 0, selfi = 0, j = 0, otherj = 0, result_k = 0;

        if ((self_length | 0) > (other_length | 0)) {
            u = self, v = self_length;
            self = other, self_length = other_length;
            other = u, other_length = v;
        }

        m = (self_length + other_length) | 0;
        if (((result_length | 0) > (m | 0)) | ((result_length | 0) <= 0))
            result_length = m;

        if ((result_length | 0) < (self_length | 0))
            self_length = result_length;

        if ((result_length | 0) < (other_length | 0))
            other_length = result_length;

        for (; (i | 0) < (self_length | 0); i = (i + 32) | 0) {
            selfi = (self + i) | 0;

            ah0 = heap[(selfi | 0) >> 2] | 0,
            ah1 = heap[(selfi | 4) >> 2] | 0,
            ah2 = heap[(selfi | 8) >> 2] | 0,
            ah3 = heap[(selfi | 12) >> 2] | 0,
            ah4 = heap[(selfi | 16) >> 2] | 0,
            ah5 = heap[(selfi | 20) >> 2] | 0,
            ah6 = heap[(selfi | 24) >> 2] | 0,
            ah7 = heap[(selfi | 28) >> 2] | 0,
            al0 = ah0 & 0xffff,
            al1 = ah1 & 0xffff,
            al2 = ah2 & 0xffff,
            al3 = ah3 & 0xffff,
            al4 = ah4 & 0xffff,
            al5 = ah5 & 0xffff,
            al6 = ah6 & 0xffff,
            al7 = ah7 & 0xffff,
            ah0 = ah0 >>> 16,
            ah1 = ah1 >>> 16,
            ah2 = ah2 >>> 16,
            ah3 = ah3 >>> 16,
            ah4 = ah4 >>> 16,
            ah5 = ah5 >>> 16,
            ah6 = ah6 >>> 16,
            ah7 = ah7 >>> 16;

            upper8 = upper9 = upper10 = upper11 = upper12 = upper13 = upper14 = upper15 = 0;

            for (j = 0; (j | 0) < (other_length | 0); j = (j + 32) | 0) {
                otherj = (other + j) | 0;
                result_k = (result + (i + j | 0)) | 0;

                bh0 = heap[(otherj | 0) >> 2] | 0,
                bh1 = heap[(otherj | 4) >> 2] | 0,
                bh2 = heap[(otherj | 8) >> 2] | 0,
                bh3 = heap[(otherj | 12) >> 2] | 0,
                bh4 = heap[(otherj | 16) >> 2] | 0,
                bh5 = heap[(otherj | 20) >> 2] | 0,
                bh6 = heap[(otherj | 24) >> 2] | 0,
                bh7 = heap[(otherj | 28) >> 2] | 0,
                bl0 = bh0 & 0xffff,
                bl1 = bh1 & 0xffff,
                bl2 = bh2 & 0xffff,
                bl3 = bh3 & 0xffff,
                bl4 = bh4 & 0xffff,
                bl5 = bh5 & 0xffff,
                bl6 = bh6 & 0xffff,
                bl7 = bh7 & 0xffff,
                bh0 = bh0 >>> 16,
                bh1 = bh1 >>> 16,
                bh2 = bh2 >>> 16,
                bh3 = bh3 >>> 16,
                bh4 = bh4 >>> 16,
                bh5 = bh5 >>> 16,
                bh6 = bh6 >>> 16,
                bh7 = bh7 >>> 16;

                upper0 = heap[(result_k | 0) >> 2] | 0,
                upper1 = heap[(result_k | 4) >> 2] | 0,
                upper2 = heap[(result_k | 8) >> 2] | 0,
                upper3 = heap[(result_k | 12) >> 2] | 0,
                upper4 = heap[(result_k | 16) >> 2] | 0,
                upper5 = heap[(result_k | 20) >> 2] | 0,
                upper6 = heap[(result_k | 24) >> 2] | 0,
                upper7 = heap[(result_k | 28) >> 2] | 0;

                u = ((imul(al0, bl0) | 0) + (upper8 & 0xffff) | 0) + (upper0 & 0xffff) | 0;
                v = ((imul(ah0, bl0) | 0) + (upper8 >>> 16) | 0) + (upper0 >>> 16) | 0;
                w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper0 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl1) | 0) + (m & 0xffff) | 0) + (upper1 & 0xffff) | 0;
                v = ((imul(ah0, bl1) | 0) + (m >>> 16) | 0) + (upper1 >>> 16) | 0;
                w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper1 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl2) | 0) + (m & 0xffff) | 0) + (upper2 & 0xffff) | 0;
                v = ((imul(ah0, bl2) | 0) + (m >>> 16) | 0) + (upper2 >>> 16) | 0;
                w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper2 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl3) | 0) + (m & 0xffff) | 0) + (upper3 & 0xffff) | 0;
                v = ((imul(ah0, bl3) | 0) + (m >>> 16) | 0) + (upper3 >>> 16) | 0;
                w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper3 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl4) | 0) + (m & 0xffff) | 0) + (upper4 & 0xffff) | 0;
                v = ((imul(ah0, bl4) | 0) + (m >>> 16) | 0) + (upper4 >>> 16) | 0;
                w = ((imul(al0, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper4 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl5) | 0) + (m & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah0, bl5) | 0) + (m >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al0, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl6) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah0, bl6) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al0, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al0, bl7) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah0, bl7) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al0, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                upper8 = m;

                u = ((imul(al1, bl0) | 0) + (upper9 & 0xffff) | 0) + (upper1 & 0xffff) | 0;
                v = ((imul(ah1, bl0) | 0) + (upper9 >>> 16) | 0) + (upper1 >>> 16) | 0;
                w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper1 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl1) | 0) + (m & 0xffff) | 0) + (upper2 & 0xffff) | 0;
                v = ((imul(ah1, bl1) | 0) + (m >>> 16) | 0) + (upper2 >>> 16) | 0;
                w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper2 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl2) | 0) + (m & 0xffff) | 0) + (upper3 & 0xffff) | 0;
                v = ((imul(ah1, bl2) | 0) + (m >>> 16) | 0) + (upper3 >>> 16) | 0;
                w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper3 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl3) | 0) + (m & 0xffff) | 0) + (upper4 & 0xffff) | 0;
                v = ((imul(ah1, bl3) | 0) + (m >>> 16) | 0) + (upper4 >>> 16) | 0;
                w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper4 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl4) | 0) + (m & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah1, bl4) | 0) + (m >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al1, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl5) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah1, bl5) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al1, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl6) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah1, bl6) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al1, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al1, bl7) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah1, bl7) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al1, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                upper9 = m;

                u = ((imul(al2, bl0) | 0) + (upper10 & 0xffff) | 0) + (upper2 & 0xffff) | 0;
                v = ((imul(ah2, bl0) | 0) + (upper10 >>> 16) | 0) + (upper2 >>> 16) | 0;
                w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper2 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl1) | 0) + (m & 0xffff) | 0) + (upper3 & 0xffff) | 0;
                v = ((imul(ah2, bl1) | 0) + (m >>> 16) | 0) + (upper3 >>> 16) | 0;
                w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper3 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl2) | 0) + (m & 0xffff) | 0) + (upper4 & 0xffff) | 0;
                v = ((imul(ah2, bl2) | 0) + (m >>> 16) | 0) + (upper4 >>> 16) | 0;
                w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper4 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl3) | 0) + (m & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah2, bl3) | 0) + (m >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl4) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah2, bl4) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al2, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl5) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah2, bl5) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al2, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl6) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah2, bl6) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al2, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al2, bl7) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah2, bl7) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al2, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                upper10 = m;

                u = ((imul(al3, bl0) | 0) + (upper11 & 0xffff) | 0) + (upper3 & 0xffff) | 0;
                v = ((imul(ah3, bl0) | 0) + (upper11 >>> 16) | 0) + (upper3 >>> 16) | 0;
                w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper3 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl1) | 0) + (m & 0xffff) | 0) + (upper4 & 0xffff) | 0;
                v = ((imul(ah3, bl1) | 0) + (m >>> 16) | 0) + (upper4 >>> 16) | 0;
                w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper4 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl2) | 0) + (m & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah3, bl2) | 0) + (m >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl3) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah3, bl3) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl4) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah3, bl4) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al3, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl5) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah3, bl5) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al3, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl6) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah3, bl6) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al3, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                u = ((imul(al3, bl7) | 0) + (m & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                v = ((imul(ah3, bl7) | 0) + (m >>> 16) | 0) + (upper10 >>> 16) | 0;
                w = ((imul(al3, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper10 = (w << 16) | (u & 0xffff);

                upper11 = m;

                u = ((imul(al4, bl0) | 0) + (upper12 & 0xffff) | 0) + (upper4 & 0xffff) | 0;
                v = ((imul(ah4, bl0) | 0) + (upper12 >>> 16) | 0) + (upper4 >>> 16) | 0;
                w = ((imul(al4, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper4 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl1) | 0) + (m & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah4, bl1) | 0) + (m >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al4, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl2) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah4, bl2) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al4, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl3) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah4, bl3) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al4, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl4) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah4, bl4) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al4, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl5) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah4, bl5) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al4, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl6) | 0) + (m & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                v = ((imul(ah4, bl6) | 0) + (m >>> 16) | 0) + (upper10 >>> 16) | 0;
                w = ((imul(al4, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper10 = (w << 16) | (u & 0xffff);

                u = ((imul(al4, bl7) | 0) + (m & 0xffff) | 0) + (upper11 & 0xffff) | 0;
                v = ((imul(ah4, bl7) | 0) + (m >>> 16) | 0) + (upper11 >>> 16) | 0;
                w = ((imul(al4, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper11 = (w << 16) | (u & 0xffff);

                upper12 = m;

                u = ((imul(al5, bl0) | 0) + (upper13 & 0xffff) | 0) + (upper5 & 0xffff) | 0;
                v = ((imul(ah5, bl0) | 0) + (upper13 >>> 16) | 0) + (upper5 >>> 16) | 0;
                w = ((imul(al5, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper5 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl1) | 0) + (m & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah5, bl1) | 0) + (m >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al5, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl2) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah5, bl2) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al5, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl3) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah5, bl3) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al5, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl4) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah5, bl4) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al5, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl5) | 0) + (m & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                v = ((imul(ah5, bl5) | 0) + (m >>> 16) | 0) + (upper10 >>> 16) | 0;
                w = ((imul(al5, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper10 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl6) | 0) + (m & 0xffff) | 0) + (upper11 & 0xffff) | 0;
                v = ((imul(ah5, bl6) | 0) + (m >>> 16) | 0) + (upper11 >>> 16) | 0;
                w = ((imul(al5, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper11 = (w << 16) | (u & 0xffff);

                u = ((imul(al5, bl7) | 0) + (m & 0xffff) | 0) + (upper12 & 0xffff) | 0;
                v = ((imul(ah5, bl7) | 0) + (m >>> 16) | 0) + (upper12 >>> 16) | 0;
                w = ((imul(al5, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper12 = (w << 16) | (u & 0xffff);

                upper13 = m;

                u = ((imul(al6, bl0) | 0) + (upper14 & 0xffff) | 0) + (upper6 & 0xffff) | 0;
                v = ((imul(ah6, bl0) | 0) + (upper14 >>> 16) | 0) + (upper6 >>> 16) | 0;
                w = ((imul(al6, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper6 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl1) | 0) + (m & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah6, bl1) | 0) + (m >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al6, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl2) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah6, bl2) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al6, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl3) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah6, bl3) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al6, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl4) | 0) + (m & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                v = ((imul(ah6, bl4) | 0) + (m >>> 16) | 0) + (upper10 >>> 16) | 0;
                w = ((imul(al6, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper10 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl5) | 0) + (m & 0xffff) | 0) + (upper11 & 0xffff) | 0;
                v = ((imul(ah6, bl5) | 0) + (m >>> 16) | 0) + (upper11 >>> 16) | 0;
                w = ((imul(al6, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper11 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl6) | 0) + (m & 0xffff) | 0) + (upper12 & 0xffff) | 0;
                v = ((imul(ah6, bl6) | 0) + (m >>> 16) | 0) + (upper12 >>> 16) | 0;
                w = ((imul(al6, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper12 = (w << 16) | (u & 0xffff);

                u = ((imul(al6, bl7) | 0) + (m & 0xffff) | 0) + (upper13 & 0xffff) | 0;
                v = ((imul(ah6, bl7) | 0) + (m >>> 16) | 0) + (upper13 >>> 16) | 0;
                w = ((imul(al6, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper13 = (w << 16) | (u & 0xffff);

                upper14 = m;

                u = ((imul(al7, bl0) | 0) + (upper15 & 0xffff) | 0) + (upper7 & 0xffff) | 0;
                v = ((imul(ah7, bl0) | 0) + (upper15 >>> 16) | 0) + (upper7 >>> 16) | 0;
                w = ((imul(al7, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper7 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl1) | 0) + (m & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                v = ((imul(ah7, bl1) | 0) + (m >>> 16) | 0) + (upper8 >>> 16) | 0;
                w = ((imul(al7, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper8 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl2) | 0) + (m & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                v = ((imul(ah7, bl2) | 0) + (m >>> 16) | 0) + (upper9 >>> 16) | 0;
                w = ((imul(al7, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper9 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl3) | 0) + (m & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                v = ((imul(ah7, bl3) | 0) + (m >>> 16) | 0) + (upper10 >>> 16) | 0;
                w = ((imul(al7, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper10 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl4) | 0) + (m & 0xffff) | 0) + (upper11 & 0xffff) | 0;
                v = ((imul(ah7, bl4) | 0) + (m >>> 16) | 0) + (upper11 >>> 16) | 0;
                w = ((imul(al7, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper11 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl5) | 0) + (m & 0xffff) | 0) + (upper12 & 0xffff) | 0;
                v = ((imul(ah7, bl5) | 0) + (m >>> 16) | 0) + (upper12 >>> 16) | 0;
                w = ((imul(al7, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper12 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl6) | 0) + (m & 0xffff) | 0) + (upper13 & 0xffff) | 0;
                v = ((imul(ah7, bl6) | 0) + (m >>> 16) | 0) + (upper13 >>> 16) | 0;
                w = ((imul(al7, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper13 = (w << 16) | (u & 0xffff);

                u = ((imul(al7, bl7) | 0) + (m & 0xffff) | 0) + (upper14 & 0xffff) | 0;
                v = ((imul(ah7, bl7) | 0) + (m >>> 16) | 0) + (upper14 >>> 16) | 0;
                w = ((imul(al7, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                upper14 = (w << 16) | (u & 0xffff);

                upper15 = m;

                heap[(result_k | 0) >> 2] = upper0,
                heap[(result_k | 4) >> 2] = upper1,
                heap[(result_k | 8) >> 2] = upper2,
                heap[(result_k | 12) >> 2] = upper3,
                heap[(result_k | 16) >> 2] = upper4,
                heap[(result_k | 20) >> 2] = upper5,
                heap[(result_k | 24) >> 2] = upper6,
                heap[(result_k | 28) >> 2] = upper7;
            }

            result_k = (result + (i + j | 0)) | 0;
            heap[(result_k | 0) >> 2] = upper8,
            heap[(result_k | 4) >> 2] = upper9,
            heap[(result_k | 8) >> 2] = upper10,
            heap[(result_k | 12) >> 2] = upper11,
            heap[(result_k | 16) >> 2] = upper12,
            heap[(result_k | 20) >> 2] = upper13,
            heap[(result_k | 24) >> 2] = upper14,
            heap[(result_k | 28) >> 2] = upper15;
        }
    }
    
    /**
     * Divides two numbers.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} other The offset of the second number.
     * @param {number} other_length The length of the second number.
     * @param {number} result The offset of the result.
     */
    function divide (self, self_length, other, other_length, result) {
        self = self | 0;
        self_length = self_length | 0
        other = other | 0;
        other_length = other_length | 0
        result = result | 0;

        var n = 0, d = 0, e = 0,
            u1 = 0, u0 = 0,
            v0 = 0, vh = 0, vl = 0,
            qh = 0, ql = 0, rh = 0, rl = 0,
            lower1 = 0, lower2 = 0, m = 0, carry = 0,
            i = 0, j = 0, k = 0;

        // number of significant limbs in `self` (multiplied by 4)
        for (i = (self_length - 1) & -4; (i | 0) >= 0; i = (i - 4) | 0) {
            n = heap[(self + i) >> 2] | 0;
            if (n) {
                self_length = i;
                break;
            }
        }

        // number of significant limbs in `other` (multiplied by 4)
        for (i = (other_length - 1) & -4; (i | 0) >= 0; i = (i - 4) | 0) {
            d = heap[(other + i) >> 2] | 0;
            if (d) {
                other_length = i;
                break;
            }
        }

        // `other` is zero? WTF?!

        // calculate `e` — the power of 2 of the normalization factor
        while ((d & 0x80000000) == 0) {
            d = d << 1;
            e = e + 1 | 0;
        }

        // normalize `self` in place
        u0 = heap[(self + self_length) >> 2] | 0;
        if (e) {
            u1 = u0 >>> (32 - e | 0);
            for (i = (self_length - 4) | 0; (i | 0) >= 0; i = (i - 4) | 0) {
                n = heap[(self + i) >> 2] | 0;
                heap[(self + i + 4) >> 2] = (u0 << e) | (e ? n >>> (32 - e | 0) : 0);
                u0 = n;
            }
            heap[self >> 2] = u0 << e;
        }

        // normalize `other` in place
        if (e) {
            v0 = heap[(other + other_length) >> 2] | 0;
            for (i = (other_length - 4) | 0; (i | 0) >= 0; i = (i - 4) | 0) {
                d = heap[(other + i) >> 2] | 0;
                heap[(other + i + 4) >> 2] = (v0 << e) | (d >>> (32 - e | 0));
                v0 = d;
            }
            heap[other >> 2] = v0 << e;
        }

        // divisor parts won'lower change
        v0 = heap[(other + other_length) >> 2] | 0;
        vh = v0 >>> 16, vl = v0 & 0xffff;

        // perform division
        for (i = self_length; (i | 0) >= (other_length | 0); i = (i - 4) | 0) {
            j = (i - other_length) | 0;

            // estimate high part of the quotient
            u0 = heap[(self + i) >> 2] | 0;
            qh = ((u1 >>> 0) / (vh >>> 0)) | 0, rh = ((u1 >>> 0) % (vh >>> 0)) | 0, lower1 = imul(qh, vl) | 0;
            while (((qh | 0) == 0x10000) | ((lower1 >>> 0) > (((rh << 16) | (u0 >>> 16)) >>> 0))) {
                qh = (qh - 1) | 0, rh = (rh + vh) | 0, lower1 = (lower1 - vl) | 0;
                if ((rh | 0) >= 0x10000) break;
            }

            // bulk multiply - and - subtract
            // m - multiplication carry, carry - subtraction carry
            m = 0, carry = 0;
            for (k = 0; (k | 0) <= (other_length | 0); k = (k + 4) | 0) {
                d = heap[(other + k) >> 2] | 0;
                lower1 = (imul(qh, d & 0xffff) | 0) + (m >>> 16) | 0;
                lower2 = (imul(qh, d >>> 16) | 0) + (lower1 >>> 16) | 0;
                d = (m & 0xffff) | (lower1 << 16);
                m = lower2;
                n = heap[(self + j + k) >> 2] | 0;
                lower1 = ((n & 0xffff) - (d & 0xffff) | 0) + carry | 0;
                lower2 = ((n >>> 16) - (d >>> 16) | 0) + (lower1 >> 16) | 0;
                heap[(self + j + k) >> 2] = (lower2 << 16) | (lower1 & 0xffff);
                carry = lower2 >> 16;
            }
            lower1 = ((u1 & 0xffff) - (m & 0xffff) | 0) + carry | 0;
            lower2 = ((u1 >>> 16) - (m >>> 16) | 0) + (lower1 >> 16) | 0;
            u1 = (lower2 << 16) | (lower1 & 0xffff);
            carry = lower2 >> 16;

            // add `other` back if got carry - out
            if (carry) {
                qh = (qh - 1) | 0;
                carry = 0;
                for (k = 0; (k | 0) <= (other_length | 0); k = (k + 4) | 0) {
                    d = heap[(other + k) >> 2] | 0;
                    n = heap[(self + j + k) >> 2] | 0;
                    lower1 = (n & 0xffff) + carry | 0;
                    lower2 = (n >>> 16) + d + (lower1 >>> 16) | 0;
                    heap[(self + j + k) >> 2] = (lower2 << 16) | (lower1 & 0xffff);
                    carry = lower2 >>> 16;
                }
                u1 = (u1 + carry) | 0;
            }

            // estimate low part of the quotient
            u0 = heap[(self + i) >> 2] | 0;
            n = (u1 << 16) | (u0 >>> 16);
            ql = ((n >>> 0) / (vh >>> 0)) | 0, rl = ((n >>> 0) % (vh >>> 0)) | 0, lower1 = imul(ql, vl) | 0;
            while (((ql | 0) == 0x10000) | ((lower1 >>> 0) > (((rl << 16) | (u0 & 0xffff)) >>> 0))) {
                ql = (ql - 1) | 0, rl = (rl + vh) | 0, lower1 = (lower1 - vl) | 0;
                if ((rl | 0) >= 0x10000) break;
            }

            // bulk multiply - and - subtract
            // m - multiplication carry, carry - subtraction carry
            m = 0, carry = 0;
            for (k = 0; (k | 0) <= (other_length | 0); k = (k + 4) | 0) {
                d = heap[(other + k) >> 2] | 0;
                lower1 = (imul(ql, d & 0xffff) | 0) + (m & 0xffff) | 0;
                lower2 = ((imul(ql, d >>> 16) | 0) + (lower1 >>> 16) | 0) + (m >>> 16) | 0;
                d = (lower1 & 0xffff) | (lower2 << 16);
                m = lower2 >>> 16;
                n = heap[(self + j + k) >> 2] | 0;
                lower1 = ((n & 0xffff) - (d & 0xffff) | 0) + carry | 0;
                lower2 = ((n >>> 16) - (d >>> 16) | 0) + (lower1 >> 16) | 0;
                carry = lower2 >> 16;
                heap[(self + j + k) >> 2] = (lower2 << 16) | (lower1 & 0xffff);
            }
            lower1 = ((u1 & 0xffff) - (m & 0xffff) | 0) + carry | 0;
            lower2 = ((u1 >>> 16) - (m >>> 16) | 0) + (lower1 >> 16) | 0;
            carry = lower2 >> 16;

            // add `other` back if got carry - out
            if (carry) {
                ql = (ql - 1) | 0;
                carry = 0;
                for (k = 0; (k | 0) <= (other_length | 0); k = (k + 4) | 0) {
                    d = heap[(other + k) >> 2] | 0;
                    n = heap[(self + j + k) >> 2] | 0;
                    lower1 = ((n & 0xffff) + (d & 0xffff) | 0) + carry | 0;
                    lower2 = ((n >>> 16) + (d >>> 16) | 0) + (lower1 >>> 16) | 0;
                    carry = lower2 >>> 16;
                    heap[(self + j + k) >> 2] = (lower1 & 0xffff) | (lower2 << 16);
                }
            }

            // got quotient limb
            heap[(result + j) >> 2] = (qh << 16) | ql;

            u1 = heap[(self + i) >> 2] | 0;
        }

        if (e) {
            // TOotherO denormalize `other` in place

            // denormalize `self` in place
            u0 = heap[self >> 2] | 0;
            for (i = 4; (i | 0) <= (other_length | 0); i = (i + 4) | 0) {
                n = heap[(self + i) >> 2] | 0;
                heap[(self + i - 4) >> 2] = (n << (32 - e | 0)) | (u0 >>> e);
                u0 = n;
            }
            heap[(self + other_length) >> 2] = u0 >>> e;
        }
    }
     
    
    /**
     * Squares a number.
     * 
     * @param {number} self The offset of the first number.
     * @param {number} self_length The length of the first number.
     * @param {number} result The offset of the result.
     */
    function square (self, self_length, result) {
        self = self | 0;
        self_length = self_length | 0;
        result = result | 0;

        var al0 = 0, al1 = 0, al2 = 0, al3 = 0, al4 = 0, al5 = 0, al6 = 0, al7 = 0, ah0 = 0, ah1 = 0, ah2 = 0, ah3 = 0, ah4 = 0, ah5 = 0, ah6 = 0, ah7 = 0,
            bl0 = 0, bl1 = 0, bl2 = 0, bl3 = 0, bl4 = 0, bl5 = 0, bl6 = 0, bl7 = 0, bh0 = 0, bh1 = 0, bh2 = 0, bh3 = 0, bh4 = 0, bh5 = 0, bh6 = 0, bh7 = 0,
            upper0 = 0, upper1 = 0, upper2 = 0, upper3 = 0, upper4 = 0, upper5 = 0, upper6 = 0, upper7 = 0, upper8 = 0, upper9 = 0, upper10 = 0, upper11 = 0, upper12 = 0, upper13 = 0, upper14 = 0, upper15 = 0,
            u = 0, v = 0, w = 0, carry = 0, h = 0, m = 0, upper = 0,
            d = 0, dd = 0, p = 0, i = 0, j = 0, k = 0, selfi = 0, selfj = 0, result_k = 0;

        // prepare for iterations
        for (; (i | 0) < (self_length | 0); i = (i + 4) | 0) {
            result_k = result + (i<<1) | 0;
            ah0 = heap[(self + i) >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16;
            u = imul(al0,al0) | 0;
            v = (imul(al0,ah0) | 0) + (u >>> 17) | 0;
            w = (imul(ah0,ah0) | 0) + (v >>> 15) | 0;
            heap[(result_k) >> 2] = (v << 17) | (u & 0x1ffff);
            heap[(result_k | 4) >> 2] = w;
        }

        // unrolled 1st iteration
        for (p = 0; (p | 0) < (self_length | 0); p = (p + 8) | 0) {
            selfi = self + p | 0, result_k = result + (p<<1) | 0;

            ah0 = heap[(selfi) >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16;

            bh0 = heap[(selfi | 4) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16;

            u = imul(al0,bl0) | 0;
            v = (imul(al0,bh0) | 0) + (u >>> 16) | 0;
            w = (imul(ah0,bl0) | 0) + (v & 0xffff) | 0;
            m = ((imul(ah0,bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;

            upper = heap[(result_k | 4) >> 2] | 0;
            u = (upper & 0xffff) + ((u & 0xffff) << 1) | 0;
            w = ((upper >>> 16) + ((w & 0xffff) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 4) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 8) >> 2] | 0;
            u = ((upper & 0xffff) + ((m & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((m >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 8) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            if (carry) {
                upper = heap[(result_k | 12) >> 2] | 0;
                u = (upper & 0xffff) + carry | 0;
                w = (upper >>> 16) + (u >>> 16) | 0;
                heap[(result_k | 12) >> 2] = (w << 16) | (u & 0xffff);
            }
        }

        // unrolled 2nd iteration
        for (p = 0; (p | 0) < (self_length | 0); p = (p + 16) | 0) {
            selfi = self + p | 0, result_k = result + (p<<1) | 0;

            ah0 = heap[(selfi) >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16,
            ah1 = heap[(selfi | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16;

            bh0 = heap[(selfi | 8) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16,
            bh1 = heap[(selfi | 12) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16;

            u = imul(al0, bl0) | 0;
            v = imul(ah0, bl0) | 0;
            w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper0 = (w << 16) | (u & 0xffff);

            u = (imul(al0, bl1) | 0) + (m & 0xffff) | 0;
            v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
            w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper1 = (w << 16) | (u & 0xffff);

            upper2 = m;

            u = (imul(al1, bl0) | 0) + (upper1 & 0xffff) | 0;
            v = (imul(ah1, bl0) | 0) + (upper1 >>> 16) | 0;
            w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper1 = (w << 16) | (u & 0xffff);

            u = ((imul(al1, bl1) | 0) + (upper2 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah1, bl1) | 0) + (upper2 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper2 = (w << 16) | (u & 0xffff);

            upper3 = m;

            upper = heap[(result_k | 8) >> 2] | 0;
            u = (upper & 0xffff) + ((upper0 & 0xffff) << 1) | 0;
            w = ((upper >>> 16) + ((upper0 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 8) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 12) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper1 & 0xffff) << 1) | 0)  + carry | 0;
            w = ((upper >>> 16) + ((upper1 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 12) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 16) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper2 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper2 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 16) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 20) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper3 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper3 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 20) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            for (k = 24; !!carry & ((k | 0) < 32); k = (k + 4) | 0) {
                upper = heap[(result_k | k) >> 2] | 0;
                u = (upper & 0xffff) + carry | 0;
                w = (upper >>> 16) + (u >>> 16) | 0;
                heap[(result_k | k) >> 2] = (w << 16) | (u & 0xffff);
                carry = w >>> 16;
            }
        }

        // unrolled 3rd iteration
        for (p = 0; (p | 0) < (self_length | 0); p = (p + 32) | 0) {
            selfi = self + p | 0, result_k = result + (p<<1) | 0;

            ah0 = heap[(selfi) >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16,
            ah1 = heap[(selfi | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16,
            ah2 = heap[(selfi | 8) >> 2] | 0, al2 = ah2 & 0xffff, ah2 = ah2 >>> 16,
            ah3 = heap[(selfi | 12) >> 2] | 0, al3 = ah3 & 0xffff, ah3 = ah3 >>> 16;

            bh0 = heap[(selfi | 16) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16,
            bh1 = heap[(selfi | 20) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16,
            bh2 = heap[(selfi | 24) >> 2] | 0, bl2 = bh2 & 0xffff, bh2 = bh2 >>> 16,
            bh3 = heap[(selfi | 28) >> 2] | 0, bl3 = bh3 & 0xffff, bh3 = bh3 >>> 16;

            u = imul(al0, bl0) | 0;
            v = imul(ah0, bl0) | 0;
            w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper0 = (w << 16) | (u & 0xffff);

            u = (imul(al0, bl1) | 0) + (m & 0xffff) | 0;
            v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
            w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper1 = (w << 16) | (u & 0xffff);

            u = (imul(al0, bl2) | 0) + (m & 0xffff) | 0;
            v = (imul(ah0, bl2) | 0) + (m >>> 16) | 0;
            w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper2 = (w << 16) | (u & 0xffff);

            u = (imul(al0, bl3) | 0) + (m & 0xffff) | 0;
            v = (imul(ah0, bl3) | 0) + (m >>> 16) | 0;
            w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper3 = (w << 16) | (u & 0xffff);

            upper4 = m;

            u = (imul(al1, bl0) | 0) + (upper1 & 0xffff) | 0;
            v = (imul(ah1, bl0) | 0) + (upper1 >>> 16) | 0;
            w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper1 = (w << 16) | (u & 0xffff);

            u = ((imul(al1, bl1) | 0) + (upper2 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah1, bl1) | 0) + (upper2 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper2 = (w << 16) | (u & 0xffff);

            u = ((imul(al1, bl2) | 0) + (upper3 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah1, bl2) | 0) + (upper3 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper3 = (w << 16) | (u & 0xffff);

            u = ((imul(al1, bl3) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah1, bl3) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper4 = (w << 16) | (u & 0xffff);

            upper5 = m;

            u = (imul(al2, bl0) | 0) + (upper2 & 0xffff) | 0;
            v = (imul(ah2, bl0) | 0) + (upper2 >>> 16) | 0;
            w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper2 = (w << 16) | (u & 0xffff);

            u = ((imul(al2, bl1) | 0) + (upper3 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah2, bl1) | 0) + (upper3 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper3 = (w << 16) | (u & 0xffff);

            u = ((imul(al2, bl2) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah2, bl2) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper4 = (w << 16) | (u & 0xffff);

            u = ((imul(al2, bl3) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah2, bl3) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper5 = (w << 16) | (u & 0xffff);

            upper6 = m;

            u = (imul(al3, bl0) | 0) + (upper3 & 0xffff) | 0;
            v = (imul(ah3, bl0) | 0) + (upper3 >>> 16) | 0;
            w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper3 = (w << 16) | (u & 0xffff);

            u = ((imul(al3, bl1) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah3, bl1) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper4 = (w << 16) | (u & 0xffff);

            u = ((imul(al3, bl2) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah3, bl2) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper5 = (w << 16) | (u & 0xffff);

            u = ((imul(al3, bl3) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
            v = ((imul(ah3, bl3) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
            w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
            m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
            upper6 = (w << 16) | (u & 0xffff);

            upper7 = m;

            upper = heap[(result_k | 16) >> 2] | 0;
            u = (upper & 0xffff) + ((upper0 & 0xffff) << 1) | 0;
            w = ((upper >>> 16) + ((upper0 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 16) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 20) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper1 & 0xffff) << 1) | 0)  + carry | 0;
            w = ((upper >>> 16) + ((upper1 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 20) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 24) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper2 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper2 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 24) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k | 28) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper3 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper3 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k | 28) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k + 32) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper4 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper4 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k + 32) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k + 36) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper5 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper5 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k + 36) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k + 40) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper6 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper6 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k + 40) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            upper = heap[(result_k + 44) >> 2] | 0;
            u = ((upper & 0xffff) + ((upper7 & 0xffff) << 1) | 0) + carry | 0;
            w = ((upper >>> 16) + ((upper7 >>> 16) << 1) | 0) + (u >>> 16) | 0;
            heap[(result_k + 44) >> 2] = (w << 16) | (u & 0xffff);
            carry = w >>> 16;

            for (k = 48; !!carry & ((k | 0) < 64); k = (k + 4) | 0) {
                upper = heap[(result_k + k) >> 2] | 0;
                u = (upper & 0xffff) + carry | 0;
                w = (upper >>> 16) + (u >>> 16) | 0;
                heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                carry = w >>> 16;
            }
        }

        // perform iterations
        for (d = 32; (d | 0) < (self_length | 0); d = d << 1) { // depth loop
            dd = d << 1;

            for (p = 0; (p | 0) < (self_length | 0); p = (p + dd) | 0) { // part loop
                result_k = result + (p<<1) | 0;

                h = 0;
                for (i = 0; (i | 0) < (d | 0); i = (i + 32) | 0) { // multiply - and - add loop
                    selfi = (self + p | 0) + i | 0;

                    ah0 = heap[(selfi) >> 2] | 0, al0 = ah0 & 0xffff, ah0 = ah0 >>> 16,
                    ah1 = heap[(selfi | 4) >> 2] | 0, al1 = ah1 & 0xffff, ah1 = ah1 >>> 16,
                    ah2 = heap[(selfi | 8) >> 2] | 0, al2 = ah2 & 0xffff, ah2 = ah2 >>> 16,
                    ah3 = heap[(selfi | 12) >> 2] | 0, al3 = ah3 & 0xffff, ah3 = ah3 >>> 16,
                    ah4 = heap[(selfi | 16) >> 2] | 0, al4 = ah4 & 0xffff, ah4 = ah4 >>> 16,
                    ah5 = heap[(selfi | 20) >> 2] | 0, al5 = ah5 & 0xffff, ah5 = ah5 >>> 16,
                    ah6 = heap[(selfi | 24) >> 2] | 0, al6 = ah6 & 0xffff, ah6 = ah6 >>> 16,
                    ah7 = heap[(selfi | 28) >> 2] | 0, al7 = ah7 & 0xffff, ah7 = ah7 >>> 16;

                    upper8 = upper9 = upper10 = upper11 = upper12 = upper13 = upper14 = upper15 = carry = 0;

                    for (j = 0; (j | 0) < (d | 0); j = (j + 32) | 0) {
                        selfj = ((self + p | 0) + d | 0) + j | 0;

                        bh0 = heap[(selfj) >> 2] | 0, bl0 = bh0 & 0xffff, bh0 = bh0 >>> 16,
                        bh1 = heap[(selfj | 4) >> 2] | 0, bl1 = bh1 & 0xffff, bh1 = bh1 >>> 16,
                        bh2 = heap[(selfj | 8) >> 2] | 0, bl2 = bh2 & 0xffff, bh2 = bh2 >>> 16,
                        bh3 = heap[(selfj | 12) >> 2] | 0, bl3 = bh3 & 0xffff, bh3 = bh3 >>> 16,
                        bh4 = heap[(selfj | 16) >> 2] | 0, bl4 = bh4 & 0xffff, bh4 = bh4 >>> 16,
                        bh5 = heap[(selfj | 20) >> 2] | 0, bl5 = bh5 & 0xffff, bh5 = bh5 >>> 16,
                        bh6 = heap[(selfj | 24) >> 2] | 0, bl6 = bh6 & 0xffff, bh6 = bh6 >>> 16,
                        bh7 = heap[(selfj | 28) >> 2] | 0, bl7 = bh7 & 0xffff, bh7 = bh7 >>> 16;

                        upper0 = upper1 = upper2 = upper3 = upper4 = upper5 = upper6 = upper7 = 0;

                        u = ((imul(al0, bl0) | 0) + (upper0 & 0xffff) | 0) + (upper8 & 0xffff) | 0;
                        v = ((imul(ah0, bl0) | 0) + (upper0 >>> 16) | 0) + (upper8 >>> 16) | 0;
                        w = ((imul(al0, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper0 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl1) | 0) + (upper1 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl1) | 0) + (upper1 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper1 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl2) | 0) + (upper2 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl2) | 0) + (upper2 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper2 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl3) | 0) + (upper3 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl3) | 0) + (upper3 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper3 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl4) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl4) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper4 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl5) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl5) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl6) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl6) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al0, bl7) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah0, bl7) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al0, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        upper8 = m;

                        u = ((imul(al1, bl0) | 0) + (upper1 & 0xffff) | 0) + (upper9 & 0xffff) | 0;
                        v = ((imul(ah1, bl0) | 0) + (upper1 >>> 16) | 0) + (upper9 >>> 16) | 0;
                        w = ((imul(al1, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper1 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl1) | 0) + (upper2 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl1) | 0) + (upper2 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper2 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl2) | 0) + (upper3 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl2) | 0) + (upper3 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper3 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl3) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl3) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper4 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl4) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl4) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl5) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl5) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl6) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl6) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al1, bl7) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah1, bl7) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al1, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        upper9 = m;

                        u = ((imul(al2, bl0) | 0) + (upper2 & 0xffff) | 0) + (upper10 & 0xffff) | 0;
                        v = ((imul(ah2, bl0) | 0) + (upper2 >>> 16) | 0) + (upper10 >>> 16) | 0;
                        w = ((imul(al2, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper2 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl1) | 0) + (upper3 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl1) | 0) + (upper3 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper3 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl2) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl2) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper4 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl3) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl3) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl4) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl4) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl5) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl5) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl6) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl6) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al2, bl7) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah2, bl7) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al2, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        upper10 = m;

                        u = ((imul(al3, bl0) | 0) + (upper3 & 0xffff) | 0) + (upper11 & 0xffff) | 0;
                        v = ((imul(ah3, bl0) | 0) + (upper3 >>> 16) | 0) + (upper11 >>> 16) | 0;
                        w = ((imul(al3, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper3 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl1) | 0) + (upper4 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl1) | 0) + (upper4 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper4 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl2) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl2) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl3) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl3) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl4) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl4) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl5) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl5) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl6) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl6) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        u = ((imul(al3, bl7) | 0) + (upper10 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah3, bl7) | 0) + (upper10 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al3, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper10 = (w << 16) | (u & 0xffff);

                        upper11 = m;

                        u = ((imul(al4, bl0) | 0) + (upper4 & 0xffff) | 0) + (upper12 & 0xffff) | 0;
                        v = ((imul(ah4, bl0) | 0) + (upper4 >>> 16) | 0) + (upper12 >>> 16) | 0;
                        w = ((imul(al4, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper4 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl1) | 0) + (upper5 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl1) | 0) + (upper5 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl2) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl2) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl3) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl3) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl4) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl4) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl5) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl5) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl6) | 0) + (upper10 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl6) | 0) + (upper10 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper10 = (w << 16) | (u & 0xffff);

                        u = ((imul(al4, bl7) | 0) + (upper11 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah4, bl7) | 0) + (upper11 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al4, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper11 = (w << 16) | (u & 0xffff);

                        upper12 = m;

                        u = ((imul(al5, bl0) | 0) + (upper5 & 0xffff) | 0) + (upper13 & 0xffff) | 0;
                        v = ((imul(ah5, bl0) | 0) + (upper5 >>> 16) | 0) + (upper13 >>> 16) | 0;
                        w = ((imul(al5, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper5 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl1) | 0) + (upper6 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl1) | 0) + (upper6 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl2) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl2) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl3) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl3) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl4) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl4) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl5) | 0) + (upper10 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl5) | 0) + (upper10 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper10 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl6) | 0) + (upper11 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl6) | 0) + (upper11 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper11 = (w << 16) | (u & 0xffff);

                        u = ((imul(al5, bl7) | 0) + (upper12 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah5, bl7) | 0) + (upper12 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al5, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper12 = (w << 16) | (u & 0xffff);

                        upper13 = m;

                        u = ((imul(al6, bl0) | 0) + (upper6 & 0xffff) | 0) + (upper14 & 0xffff) | 0;
                        v = ((imul(ah6, bl0) | 0) + (upper6 >>> 16) | 0) + (upper14 >>> 16) | 0;
                        w = ((imul(al6, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper6 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl1) | 0) + (upper7 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl1) | 0) + (upper7 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl2) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl2) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl3) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl3) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl4) | 0) + (upper10 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl4) | 0) + (upper10 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper10 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl5) | 0) + (upper11 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl5) | 0) + (upper11 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper11 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl6) | 0) + (upper12 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl6) | 0) + (upper12 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper12 = (w << 16) | (u & 0xffff);

                        u = ((imul(al6, bl7) | 0) + (upper13 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah6, bl7) | 0) + (upper13 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al6, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper13 = (w << 16) | (u & 0xffff);

                        upper14 = m;

                        u = ((imul(al7, bl0) | 0) + (upper7 & 0xffff) | 0) + (upper15 & 0xffff) | 0;
                        v = ((imul(ah7, bl0) | 0) + (upper7 >>> 16) | 0) + (upper15 >>> 16) | 0;
                        w = ((imul(al7, bh0) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper7 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl1) | 0) + (upper8 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl1) | 0) + (upper8 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh1) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper8 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl2) | 0) + (upper9 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl2) | 0) + (upper9 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh2) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper9 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl3) | 0) + (upper10 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl3) | 0) + (upper10 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh3) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper10 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl4) | 0) + (upper11 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl4) | 0) + (upper11 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh4) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper11 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl5) | 0) + (upper12 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl5) | 0) + (upper12 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh5) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper12 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl6) | 0) + (upper13 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl6) | 0) + (upper13 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh6) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper13 = (w << 16) | (u & 0xffff);

                        u = ((imul(al7, bl7) | 0) + (upper14 & 0xffff) | 0) + (m & 0xffff) | 0;
                        v = ((imul(ah7, bl7) | 0) + (upper14 >>> 16) | 0) + (m >>> 16) | 0;
                        w = ((imul(al7, bh7) | 0) + (v & 0xffff) | 0) + (u >>> 16) | 0;
                        m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                        upper14 = (w << 16) | (u & 0xffff);

                        upper15 = m;

                        k = d + (i + j | 0) | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper0 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper0 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper1 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper1 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper2 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper2 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper3 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper3 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper4 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper4 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper5 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper5 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper6 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper6 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;

                        k = k + 4 | 0;
                        upper = heap[(result_k + k) >> 2] | 0;
                        u = ((upper & 0xffff) + ((upper7 & 0xffff) << 1) | 0) + carry | 0;
                        w = ((upper >>> 16) + ((upper7 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                        heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                        carry = w >>> 16;
                    }

                    k = d + (i + j | 0) | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = (((upper & 0xffff) + ((upper8 & 0xffff) << 1) | 0) + carry | 0) + h | 0;
                    w = ((upper >>> 16) + ((upper8 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper9 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper9 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper10 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper10 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper11 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper11 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper12 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper12 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper13 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper13 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper14 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper14 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    carry = w >>> 16;

                    k = k + 4 | 0;
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = ((upper & 0xffff) + ((upper15 & 0xffff) << 1) | 0) + carry | 0;
                    w = ((upper >>> 16) + ((upper15 >>> 16) << 1) | 0) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    h = w >>> 16;
                }

                for (k = k + 4 | 0; !!h & ((k | 0) < (dd<<1)); k = (k + 4) | 0) { // carry propagation loop
                    upper = heap[(result_k + k) >> 2] | 0;
                    u = (upper & 0xffff) + h | 0;
                    w = (upper >>> 16) + (u >>> 16) | 0;
                    heap[(result_k + k) >> 2] = (w << 16) | (u & 0xffff);
                    h = w >>> 16;
                }
            }
        }
    }

    /**
     * Montgomery modular reduction
     *
     * Definition:
     *
     *  MREDC(A) = A × X (mod N),
     *  M × X = N × Y + 1,
     *
     * where M = 2^(32*m) such that N < M and A < N×M
     *
     * Numbers `X` and `Y` can be calculated using Extended Euclidean Algorithm.
     */
    //TODO: doc
    function montgomery (self, self_length, other, other_length, y, result) {
        self  =  self | 0;
        self_length = self_length | 0;
        other  =  other | 0;
        other_length = other_length | 0;
        y  =  y | 0;
        result  =  result | 0;

        var T = 0,
            carry = 0, uh = 0, ul = 0, vl = 0, vh = 0, w0 = 0, w1 = 0, w2 = 0, upper0 = 0, upper1 = 0,
            i = 0, j = 0, k = 0;

        T = salloc(other_length<<1) | 0;
        zero(other_length << 1, 0, T);

        copy(self_length, self, T);

        // HselfC 14.32
        for (i = 0; (i | 0) < (other_length | 0); i = (i + 4) | 0) {
            uh = heap[(T + i) >> 2] | 0, ul = uh & 0xffff, uh = uh >>> 16;
            vh = y >>> 16, vl = y & 0xffff;
            w0 = imul(ul,vl) | 0, w1 = ((imul(ul,vh) | 0) + (imul(uh,vl) | 0) | 0) + (w0 >>> 16) | 0;
            ul = w0 & 0xffff, uh = w1 & 0xffff;
            upper1 = 0;
            for (j = 0; (j | 0) < (other_length | 0); j = (j + 4) | 0) {
                k = (i + j) | 0;
                vh = heap[(other + j) >> 2] | 0, vl = vh & 0xffff, vh = vh >>> 16;
                upper0 = heap[(T + k) >> 2] | 0;
                w0 = ((imul(ul, vl) | 0) + (upper1 & 0xffff) | 0) + (upper0 & 0xffff) | 0;
                w1 = ((imul(ul, vh) | 0) + (upper1 >>> 16) | 0) + (upper0 >>> 16) | 0;
                w2 = ((imul(uh, vl) | 0) + (w1 & 0xffff) | 0) + (w0 >>> 16) | 0;
                upper1 = ((imul(uh, vh) | 0) + (w2 >>> 16) | 0) + (w1 >>> 16) | 0;
                upper0 = (w2 << 16) | (w0 & 0xffff);
                heap[(T + k) >> 2] = upper0;
            }
            k = (i + j) | 0;
            upper0 = heap[(T + k) >> 2] | 0;
            w0 = ((upper0 & 0xffff) + (upper1 & 0xffff) | 0) + carry | 0;
            w1 = ((upper0 >>> 16) + (upper1 >>> 16) | 0) + (w0 >>> 16) | 0;
            heap[(T + k) >> 2] = (w1 << 16) | (w0 & 0xffff);
            carry = w1 >>> 16;
        }

        copy(other_length, (T + other_length) | 0, result);

        sfree(other_length<<1);

        if (carry | ((compare(other, other_length, result, other_length) | 0) <= 0)) {
            subtract(result, other_length, other, other_length, result, other_length) | 0;
        }
    }

    return {
        sreset: sreset,
        salloc: salloc,
        sfree: sfree,
        copy: copy,
        zero: zero,
        negate: negate,
        compare: compare,
        limbs: limbs,
        add: add,
        subtract: subtract,
        multiply: multiply,
        divide: divide,
        square: square,
        montgomery: montgomery
    };
}