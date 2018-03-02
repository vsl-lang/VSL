import * as llvm from 'llvm-node';
import BackendError from '../../BackendError';
import layoutType from './layoutType';

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
            case "i1": return llvm.Type.getInt1Ty(context);
            case "i8":
            case "ui8": return llvm.Type.getInt8Ty(context);
            case "i32":
            case "ui32": return llvm.Type.getInt32Ty(context);
            case "i64":
            case "ui64": return llvm.Type.getInt64Ty(context);
            case "pointer": return toLLVMType(type.parents[0], context).getPointerTo();
            case "pointer8": return llvm.Type.getInt8Ty(context).getPointerTo();
            case "opaquepointer": return llvm.StructType.get(context, []);
            case "string": return layoutType(type, context);
            default:
                throw new BackendError(
                    `Invalid \`@mock\` value. Type \`${type}\` is unsupported by the LLVM backend.`,
                    null
                );
        }
    } else {
        return layoutType(type, context);

        throw new BackendError(
            `Not sure how to compile this type.`,
            type.source
        );
    }
}
