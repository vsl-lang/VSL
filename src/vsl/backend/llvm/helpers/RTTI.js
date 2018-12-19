import { getTypeOffset } from './layoutType';
import * as llvm from 'llvm-node';

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
 * Creates a wrappee object for a given value and it's VSL type
 * @param {llvm.Value} value - value in VSL
 * @param {ScopeTypeItem} valueTy - type in vsl
 * @param {LLVMContext} context
 * @return {llvm.Value}
 */
export function getObjectForValue(value, valueTy, context) {
    const ty = getObjectTy(context);
    const alloc = context.builder.createAlloca(ty);

    context.builder.createStore(
        getMetaTypeForObject(valueTy, context),
        context.builder.createInBoundsGEP(alloc, [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 0)
        ])
    );

    let ptrVal = value;

    if (!ptrVal.type.isPointerTy()) {
        if (ptrVal.type.isIntegerTy()) {
            ptrVal = context.builder.createIntToPtr(value, llvm.Type.getInt8PtrTy(context.ctx));
        } else {
            throw new TypeError(`Do not know how to convert ${valueTy} to Object. Report this.`);
        }
    }

    context.builder.createStore(
        context.builder.createBitCast(ptrVal, llvm.Type.getInt8PtrTy(context.ctx)),
        context.builder.createInBoundsGEP(alloc, [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 1)
        ])
    );

    return alloc;
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
    return llvm.ConstantStruct.get(
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
        llvm.Type.getInt32Ty(context.ctx),

        // Field (name, offset) tuples.
        getFieldTy(context).getPointerTo()
    ], false);

    return type;
}

/**
 * Generates metatype for object
 * @param {ScopeTypeItem} item - The item to get metatype for.
 * @param {LLVMContext} context
 * @param {llvm.Value} global metaty constant.
 */
export function getMetaTypeForObject(item, context) {
    const metaTypeName = `${item.uniqueName}.MetaType`;
    const metaTypeFieldsName = `${metaTypeName}.fields`;

    const existingMetaType = context.module.getGlobalVariable(metaTypeName, true);
    if (existingMetaType) return existingMetaType;

    // Global variable with fields;
    const globalVariableFieldsTy = llvm.ArrayType.get(getFieldTy(context), item.subscope.aliases.length);
    const globalVariableFields = new llvm.GlobalVariable(
        context.module,
        globalVariableFieldsTy,
        true,
        llvm.LinkageTypes.LinkOnceODRLinkage,
        llvm.ConstantArray.get(
            llvm.ArrayType.get(getFieldTy(context), item.subscope.aliases.length),
            item.subscope.aliases.map(
                alias =>
                    getFieldObjectForField(alias, item, context)
            )
        ),
        metaTypeFieldsName
    );

    const metaTypeTy = getMetaTypeTy(context);
    const globalVariable = new llvm.GlobalVariable(
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
                llvm.ConstantInt.get(context.ctx, item.subscope.aliases.length, 32, false),

                // Fields
                llvm.ConstantExpr.getPointerCast(
                    globalVariableFields,
                    getFieldTy(context).getPointerTo()
                )
            ]
        ),
        metaTypeName
    );

    return globalVariable;
}
