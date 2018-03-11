import * as llvm from 'llvm-node';
import BackendError from '../../BackendError';
import layoutType from './layoutType';

/**
 * Converts a {@link ScopeTypeItem} to an LLVM type.
 * @param {ScopeTypeItem} type Type to convert
 * @param {Backend} backend the backend
 */
export default function toLLVMType(type, backend) {
    let mockType = type.mockType,
        context = backend.context;
    if (mockType) {
        switch(mockType) {
            case "i1": return llvm.Type.getInt1Ty(context);
            case "i8":
            case "ui8": return llvm.Type.getInt8Ty(context);
            case "i32":
            case "ui32": return llvm.Type.getInt32Ty(context);
            case "i64":
            case "ui64": return llvm.Type.getInt64Ty(context);
            case "pointer": return toLLVMType(type.parents[0], backend).getPointerTo();
            case "double": return llvm.Type.getDoubleTy(context);
            case "float": return llvm.Type.getFloatTy(context);
            case "opaquepointer":
            case "pointer8": return llvm.Type.getInt8Ty(context).getPointerTo();
            default:
                throw new BackendError(
                    `Invalid \`@mock\` value. Type \`${type}\` is unsupported by the LLVM backend.`,
                    null
                );
        }
    } else {
        return layoutType(type, backend).getPointerTo();

        throw new BackendError(
            `Not sure how to compile this type.`,
            type.source
        );
    }
}
