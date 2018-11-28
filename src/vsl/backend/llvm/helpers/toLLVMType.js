import * as llvm from 'llvm-node';
import BackendError from '../../BackendError';
import layoutType from './layoutType';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeEnumItem from '../../../scope/items/scopeEnumItem';

/**
 * Converts a {@link ScopeTypeItem} to an LLVM type.
 * @param {ScopeTypeItem} type Type to convert
 * @param {Backend} backend the backend
 */
export default function toLLVMType(type, backend) {
    let mockType = type.resolved().mockType,
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
            case "pointer": return toLLVMType(type.parameters[0], backend).getPointerTo();
            case "double": return llvm.Type.getDoubleTy(context);
            case "float": return llvm.Type.getFloatTy(context);
            case "opaquepointer":
            case "pointer8": return llvm.Type.getInt8PtrTy(context);
            default:
                throw new BackendError(
                    `Invalid \`@mock\` value. Type \`${mockType}\` is unsupported by the LLVM backend.`,
                    null
                );
        }
    } else if (type === ScopeTypeItem.RootClass) {
        // If we are the root class then we have special things to do
        return llvm.Type.getInt64Ty(context);
    } else if (type instanceof ScopeEnumItem) {
        if (!type.backingType) {
            throw new BackendError(
                `No static enumeration backing type. Specify one using ` +
                `\`@staticEnumProvider\``,
                type.source
            );
        }

        const backingType = toLLVMType(type.backingType, backend);

        if (!(backingType instanceof llvm.IntegerType)) {
            throw new BackendError(
                `The \`@staticEnumProvider\` should compile to a primitive ` +
                `integer type.`,
                type.backingType.source
            );
        }

        return backingType;
    } else {
        return layoutType(type, backend).getPointerTo();

        throw new BackendError(
            `Not sure how to compile this type.`,
            type.source
        );
    }
}
