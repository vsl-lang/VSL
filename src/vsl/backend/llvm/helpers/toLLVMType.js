import * as llvm from 'llvm-node';
import BackendError from '../../BackendError';

/**
 * Converts a {@link ScopeTypeItem} to an LLVM type.
 * @param {ScopeTypeItem} type Type to convert
 * @param {llvm.Context} context LLVM context
 * @param {Backend} backend the backend
 */
export default function toLLVMType(type, context) {
    let mockType = type.mockType;
    if (mockType) {
        switch(mockType) {
            case "i8":
            case "ui8": return llvm.Type.getInt8Ty(context);
            case "i32":
            case "ui32": return llvm.Type.getInt32Ty(context);
            case "i64":
            case "ui64": return llvm.Type.getInt64Ty(context);
            default:
                throw new BackendError(
                    `Invalid \`@_mockType\` value. Type \`${type}\` is unsupported by the LLVM backend.`,
                    null
                );
        }
    } else {
        throw new BackendError(
            `Not sure how to compile this type.`,
            null
        );
    }
}
