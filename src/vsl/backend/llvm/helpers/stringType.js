import * as llvm from 'llvm-node';

export const STRING_TYPE_NAME = 'vsl.String';

/**
 * Returns the string type given a module.
 * @param {llvm.Module} module
 * @param {llvm.Context} context
 */
export default function stringType(module, context) {
    let strStruct = module.getTypeByName(STRING_TYPE_NAME);
    if (strStruct) return strStruct;

    let newStruct = llvm.StructType.create(
        context,
        STRING_TYPE_NAME
    );

    newStruct.setBody(
        [
            llvm.Type.getInt32Ty(context),
            llvm.Type.getInt8PtrTy(context, 0)
        ],
        false
    );

    return newStruct;
}
