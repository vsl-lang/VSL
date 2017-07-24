import t from '../../../parser/nodes';
import VSLTokenType from '../../../parser/vsltokentype.js';

/**
 * Outputs an LLVM representation of a {@link Literal} node. This does not
 * include type or such. This just specifies the memory bytes and expects
 * conformance internally.
 *
 * ### String
 * String literals use the following form (UTF-8 encoded)
 *
 * ```
 * A+0x00 [B*] string
 *
 * B+0x00 [size_t] str_len
 * B+0x01 [char*]  str_head
 * ```
 *
 * ### Number
 * Numbers depend on their size for their representation
 *
 * ```
 * A+0x00 [i<size>] value
 * ```
 *
 * ### Array
 * Arrays use the same format as strings.
 * ```
 * A+0x00 [B*] array
 * A+0xNN [0] null_padding
 *
 * B+0x00 [size_t] array_len
 * B+0x01 [char*]  array_head
 * ```
 *
 * @param {Literal} literal - Node of type of a literal subclass.
 * @return {string} string representing LLVM literal representation
 */
export default function repr(literal) {
    switch (literal.type) {
        case VSLTokenType.Decimal:
        case VSLTokenType.Integer: return literal.literal;
        
        case VSLTokenType.String:
            let buffer = Buffer.from(literal.literal, 'utf-8');
            let bytes = [...buffer.values()].map(
                    byte => `i8 ${byte}`
                ).join(", ");
            
            return `{ i8* [ ${bytes} ], i32 ${buffer.length} }`;
    }
}
