import * as llvm from 'llvm-node';
import BackendError from '../../BackendError';
import layoutType from './layoutType';
import { layoutTuple } from './TupleHelpers';
import { getObjectTy } from './RTTI';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeEnumItem from '../../../scope/items/scopeEnumItem';
import ScopeTupleItem from '../../../scope/items/scopeTupleItem';


/**
 * Converts a {@link ScopeTypeItem} to an LLVM type.
 * @param {ScopeTypeItem} type Type to convert
 * @param {LLVMContext} context the context
 */
export default function toLLVMType(type, context) {
    let mockType = type.resolved().mockType;
    if (mockType) {
        switch(mockType) {
            case "i1": return llvm.Type.getInt1Ty(context.ctx);
            case "i8":
            case "ui8": return llvm.Type.getInt8Ty(context.ctx);
            case "i16":
            case "ui16": return llvm.Type.getInt16Ty(context.ctx);
            case "i32":
            case "ui32": return llvm.Type.getInt32Ty(context.ctx);
            case "i64":
            case "ui64": return llvm.Type.getInt64Ty(context.ctx);
            case "pointer": return toLLVMType(type.parameters[0], context).getPointerTo();
            case "double": return llvm.Type.getDoubleTy(context.ctx);
            case "float": return llvm.Type.getFloatTy(context.ctx);
            case "opaquepointer":
            case "pointer8": return llvm.Type.getInt8PtrTy(context.ctx);
            default:
                throw new BackendError(
                    `Invalid \`@mock\` value. Type \`${mockType}\` is unsupported by the LLVM backend.`,
                    null
                );
        }
    } else if (type === ScopeTypeItem.RootClass) {
        // If we are the root class then we have special things to do
        return getObjectTy(context).getPointerTo();
    } else if (type instanceof ScopeTupleItem) {
        return layoutTuple(type, context);
    } else if (type instanceof ScopeEnumItem) {
        if (!type.backingType) {
            throw new BackendError(
                `No static enumeration backing type. Specify one using ` +
                `\`@staticEnumProvider\``,
                type.source
            );
        }

        const backingType = toLLVMType(type.backingType, context);

        if (!(backingType instanceof llvm.IntegerType)) {
            throw new BackendError(
                `The \`@staticEnumProvider\` should compile to a primitive ` +
                `integer type.`,
                type.backingType.source
            );
        }

        return backingType;
    } else {
        return layoutType(type, context).getPointerTo();

        throw new BackendError(
            `Not sure how to compile this type.`,
            type.source
        );
    }
}
