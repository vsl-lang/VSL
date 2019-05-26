import * as llvm from "llvm-node";
import getOrInsertStructType from './getOrInsertStructType';

export const ARRAY_DEALLOC_OPT_OUT = 1 << 0;

/**
 * Creates LLVM code to create Array object.
 * @param {llvm.Value} values - A series of LLVM values to put in the VSL array.
 * @param {LLVMContext} context - Context to build in
 * @param {llvm.Type} type - Type of 'value'. You might want to do values[0].type
 * @return {llvm.Value} the value that MUST BE CAST to a supported VSL array
 *                      type.
 */
export default function createArray(values, context, type) {
    return wrapArray(
        llvm.ConstantArray.get(
            llvm.ArrayType.get(type, values.length),
            values
        ),
        context
    );
}

/**
 * Obtains INTERNAL array type.
 * @param {LLVMContext} context - Context to build in
 * @param {llvm.ArrayType} arrayTy - type of data array.
 * @return {llvm.PointerType}
 */
export function getInternalArrayTy(context, structTy) {
    return getOrInsertStructType(
        context,
        `vsl.InternalArray`,
        [
            llvm.Type.getInt8Ty(context.ctx),
            llvm.Type.getInt32Ty(context.ctx),
            llvm.Type.getInt8PtrTy(context.ctx),
            llvm.Type.getInt32Ty(context.ctx)
        ]
    );
}

/**
 * Wraps an LLVM ConstantArray as a VSL array type.
 * @param {llvm.Value} values - A series of LLVM values to put in the VSL array.
 *                            pointer to backing value.
 * @param {LLVMContext} context - Context to build in
 * @return {llvm.Value} the value that MUST BE CASE to supported VSL array.
 */
export function wrapArray(values, context) {
    return llvm.ConstantStruct.get(
        getInternalArrayTy(context, values.type),
        [
            llvm.ConstantInt.get(context, 0 | ARRAY_DEALLOC_OPT_OUT),
            llvm.ConstantInt.get(context, values.length),
            context.builder.createBitCast(
                values,
                llvm.Type.getInt8PtrTy(context.ctx)
            ),
            llvm.ConstantInt.get(context, values.length),
        ]
    )
}
