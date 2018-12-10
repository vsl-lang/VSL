import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';

export default class LLVMBitcastExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.BitcastExpression;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const typeContext = context.typeContext;

        const targetTy = toLLVMType(node.targetTy.contextualType(typeContext), context);
        const valueTy = node.valueTy;

        const valueIsUnsignedInt = valueTy.mockType?.indexOf('ui') === 0;
        const targetIsUnsignedInt = targetTy.mockType?.indexOf('ui') === 0;

        const value = regen('value', node, context);
        const sourceTy = value.type;

        // Generate correct cast. Here's what we are doing:
        //
        //    Ptr -> Ptr
        //      :bitcast
        //    UInt -> Int
        //    UInt -> UInt
        //      :ZExtOrTrunc
        //    Int -> UInt
        //    Int -> Int
        //      :SExtOrTrunc
        //    UInt -> FP
        //      :UIToFP
        //    Int -> FP
        //      :SIToFP
        //    FP -> UInt
        //      :FPToUI
        //    FP -> Int
        //      :FPToSI
        if (sourceTy.isPointerTy() && targetTy.isPointerTy()) {
            return context.builder.createBitCast(value, targetTy);
        } else if (sourceTy.isIntegerTy() && targetTy.isIntegerTy()) {
            if (valueIsUnsignedInt) {
                return context.builder.createZExtOrTrunc(value, targetTy);
            } else {
                return context.builder.createSExtOrTrunc(value, targetTy);
            }
        } else if (sourceTy.isFloatingPointTy() && targetTy.isIntegerTy()) {
            if (targetIsUnsignedInt) {
                return context.builder.createFPToUI(value, targetTy)
            } else {
                return context.builder.createFPToSI(value, targetTy)
            }
        } else if (sourceTy.isIntegerTy() && targetTy.isFloatingPointTy()) {
            if (valueIsUnsignedInt) {
                return context.builder.createUIToFP(value, targetTy);
            } else {
                return context.builder.createSIToFP(value, targetTy);
            }
        } else if (sourceTy.isIntegerTy() && targetTy.isPointerTy()) {
            return context.builder.createIntToPtr(value, targetTy);
        } else if (sourceTy.isPointerTy() && targetTy.isIntegerTy()) {
            return context.builder.createPtrToInt(value, targetTy);
        } else {
            throw new BackendError(
                `Invalid bitcast between given types`,
                node.target
            );
        }
    }
}
