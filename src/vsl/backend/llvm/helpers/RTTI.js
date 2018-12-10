import { getTypeOffset } from './layoutType';

// Contains RTTI helper functions

/**
 * Returns the LLVM type for the root `Object` class. Prefer {@link toLLVMType}
 * in 99% of cases.
 *
 * Use the {@link getObjectRTTI} to extract the RTTI field from the Object class.
 * You can use this to compare a downcast.
 *
 * @param  {LLVMContext} context
 * @return {llvm.StructType} the type of the object class.
 */
export function getObjectTy(context) {
    const objTyName = `vsl.Object`;

    const existingObjTy = context.module.getTypeByName(objTyName);
    if (existingObjTy) return existingObjTy;

    let objTy = llvm.StructType.create(context.ctx, objTyName);
    objTy.setBody([
        getMetaTypeTy(context).getPointerTo(),
        llvm.Type.getInt8PtrTy(context.ctx)
    ], false);

    return objTy;
}

/**
 * Generates metatype for a field.
 * @param {LLVMContext} context
 * @return {llvm.StructType}
 */
export function getFieldTy(context) {
    return llvm.StructType.get(
        context.ctx,
        [
            // Field name
            llvm.Type.getInt8PtrTy(context.ctx),

            // Field offset
            llvm.Type.getInt64Ty(context.ctx)
        ],
        false
    );
}

/**
 * Generates metatype for a field.
 * @param {ScopeAliasItem} alias
 * @param {ScopeTypeItem} type - Type containing the alias
 * @param {LLVMContext} context
 * @return {llvm.ConstantStruct}
 */
export function getFieldObjectForField(alias, type, context) {
    return llvm.ConstantStruct(
        getFieldTy(context),
        [
            // Field name
            context.builder.createGlobalStringPtr(alias.rootId),

            // Field offset
            llvm.ConstantInt.get(context.ctx, getTypeOffset(type, alias), 64, false)
        ]
    );
}

/**
 * Obtains the metatype type. This has a link to vtables.
 * @param  {LLVMContext} context
 * @return {llvm.StructType} the type of the meta type class.
 */
export function getMetaTypeTy(context) {
    const tyName = `vsl.MetaType`;

    const existingTy = context.module.getTypeByName(tyName);
    if (existingTy) return existingTy;

    let type = llvm.StructType.create(context.ctx, tyName);
    type.setBody([
        // Type Name
        llvm.Type.getInt8PtrTy(context.ctx),

        // Amount of fields
        llvm.Type.getInt32PtrTy(context.ctx),

        // Field (name, offset) tuples.
        llvm.ArrayType.get(getFieldTy(context), 0)
    ], false);

    return type;
}

/**
 * Generates metatype for object
 * @param {ScopeTypeItem} item - The item to get metatype for.
 * @param {LLVMContext} context
 */
export function getMetaTypeForObject(item, context) {
    const metaTypeName = `${item.uniqueName}.MetaType`;

    const existingMetaType = context.module.getGlobalVariable(metaTypeName, true);
    if (existingMetaType) return existingMetaType;

    const metaTypeTy = getMetaTypeTy(context);
    const globalVariable = new GlobalVariable(
        context.module,
        metaTypeTy,
        true,
        llvm.LinkageTypes.LinkOnceODRLinkage,
        llvm.ConstantStruct.get(
            metaTypeTy,
            [
                // Type name
                context.builder.createGlobalStringPtr(item.toString()),

                // Field count
                llvm.ConstantInt.get(context.ctx, item.aliases.length, 32, false),

                // Fields
                llvm.ConstantExpr.getPointerCast(
                    llvm.ConstantArray.get(
                        getFieldTy(context),
                        item.aliases.map(
                            alias =>
                                getFieldObjectForField(alias, item, context)
                        )
                    ),
                    llvm.ArrayType.get(getFieldTy(context), 0)
                )
            ]
        ),
        metaTypeName
    );

    return globalVariable;
}
