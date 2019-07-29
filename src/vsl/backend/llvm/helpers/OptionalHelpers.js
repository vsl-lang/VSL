import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';

import getOrInsertStructType from './getOrInsertStructType';

/**
 * Gets the LLVM optional type for type T.
 * @param {?ScopeTypeItem} type - Always provide but if null then treats as UInt8
 * @param {LLVMContext} context
 * @return {llvm.Type}
 */
export function getOptionalType(type, context) {
    const name = type ? type.uniqueName : 'EMPTY';
    const storageTy = type ? toLLVMType(type, context) : llvm.Type.getInt8PtrTy(context.ctx);

    return getOrInsertStructType(context, `vsl.Optional.${name}`, [
        llvm.Type.getInt1Ty(context.ctx),
        storageTy
    ]);
}

/**
 * Wraps a value in its respective optional type
 * @param {llvm.Value} value
 * @param {ScopeTypeItem} type Type of the value
 * @param {LLVMContext} context
 * @return {llvm.Value} Wrapped value.
 */
export function wrapInOptional(value, type, context) {
    const name = `wrap.${type.uniqueName}`;

    const optionalTy = getOptionalType(type, context);
    const optionalValue = context.builder.createAlloca(optionalTy, undefined);

    // Store 'hasValue' flag
    context.builder.createStore(
        llvm.ConstantInt.get(context.ctx, 1, 1),
        context.builder.createInBoundsGEP(optionalValue, [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 0)
        ], `${name}.hv`)
    );

    context.builder.createStore(
        value,
        context.builder.createInBoundsGEP(optionalValue, [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 1)
        ], `${name}.v`)
    );

    return context.builder.createLoad(optionalValue);
}

/**
 * Evaluates to a nil value for a type
 * @param {ScopeTypeItem} type Type of the value
 * @param {LLVMContext} context
 * @return {llvm.Value} Wrapped value.
 */
export function nilForType(type, context) {
    const nilName = `vsl.Optional.nil`;
    let nilValue = context.module.getGlobalVariable(nilName);

    if (!nilValue) {
        const noneOptTy = getOptionalType(null, context);
        nilValue = new llvm.GlobalVariable(
            context.module,
            noneOptTy,
            true,
            llvm.LinkageTypes.LinkOnceODRLinkage,
            llvm.ConstantStruct.get(noneOptTy, [
                llvm.ConstantInt.get(context.ctx, 0),
                llvm.ConstantPointerNull.get(
                    llvm.Type.getInt8PtrTy(context.ctx)
                )
            ]),
            nilName
        );
    }

    return context.builder.createLoad(
        context.builder.createBitCast(nilValue, getOptionalType(type, context).getPointerTo())
    )
}
