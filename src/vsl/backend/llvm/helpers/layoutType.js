import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import ScopeGenericSpecialization from '../../../scope/items/scopeGenericSpecialization';
import ScopeDynFieldItem from '../../../scope/items/scopeDynFieldItem';
import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import { getVTableTy } from './VTable';
import ValueRef from '../ValueRef';

/**
 * Creates the LLVM layout for a {@link ScopeTypeItem}. This specifically
 * handles classes.
 *
 * ## Parts
 *
 *  1. Create type with primary name
 *  2. Layout inherited properties
 *  3. Layout interfaces properties.
 *  4. Layout unique properties
 *  5. V-table append
 *
 * V-tables are seperately managed. If a type supports dynamic dispatch than
 * potentially a suffix `typeId` will be stored.
 *
 * @param {ScopeTypeItem} type
 * @param {LLVMContext} context
 */
export default function layoutType(type, context) {
    const structType = layoutUnderlyingType(type, context);
    const resultTy = type.isByValue ? structType : structType.getPointerTo();
    return resultTy;
}

/**
 * Obtains the underlying structure type behind a type
 * @param {ScopeTypeItem} type - type to layout
 * @param {LLVMContext} context
 * @return {llvm.StructType}
 */
export function layoutUnderlyingType(type, context) {
    const { context: ctx, module } = context.backend;
    const typeName = type.uniqueName;
    const typeContext = type.getTypeContext();

    const existingType = module.getTypeByName(typeName);
    if (existingType) {
        return existingType;
    } else {
        const structType = llvm.StructType.create(
            ctx,
            typeName
        );

        const fieldTypes = type.subscope.aliases
            .filter(alias => !(alias instanceof ScopeDynFieldItem))
            .map(
                alias => alias.type.contextualType(typeContext))
            .map(
                fieldType => toLLVMType(fieldType, context));


        const superClassTypes = type.hasSuperClass ? [
            layoutUnderlyingType(
                type.superclass.contextualType(type.getTypeContext()),
                context
            )
        ] : [];

        const vtableTypes = type.dynamicDispatch ? [getVTableTy(type, context)] : [];

        // Convert all fields to LLVM types.
        let layout = [
            ...superClassTypes,
            ...vtableTypes,
            ...fieldTypes
        ];

        structType.setBody(
            layout,
            false
        );

        return structType;
    }
}

/**
 * Get the vtable for a type.
 * @param {llvm.Value} value - LLVM value
 * @param {ScopeTypeItem} type - the type of input
 * @param {LLVMContext} context
 * @return {llvm.Value} value for vtable ptr
 * @throws {TypeError} if the type doesn't have vtable
 */
export function getVTableOffset(value, type, context) {
    if (!type.dynamicDispatch) {
        throw new TypeError(
            `Attempted to get vtable offset for type ${type} which is not ` +
            `dynamic`
        );
    }

    return context.builder.createInBoundsGEP(
        value,
        [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, type.hasSuperClass ? 1 : 0)
        ],
        'vtable.extract'
    );
}

/**
 * Returns the offset of a field in a POINTER-BASED type.
 * @param {llvm.Value} value - Input value
 * @param {ScopeTypeItem} type - Type of input value
 * @param {ScopeAliasItem} field - field reference
 * @param {LLVMContext} context - Same context to build in
 * @return {ValueRef} value of field pointer
 * @throws {TypeError} if field is not found.
 */
export function getTypeOffset(value, type, field, context) {
    // Get field owner (the class that declares it, e.g. might be superclass of type)
    const fieldType = field.owner.owner;

    // Get the relative field offset
    const relativeFieldOffset = fieldType.subscope
        .aliases
        .filter(alias => !(alias instanceof ScopeDynFieldItem))
        .indexOf(field);

    // Structs are more simple
    if (type.isByValue) {
        // Extract the appropriate value
        return new ValueRef(value, { aggrIdx: relativeFieldOffset });
    } else {
        let rootOffset = 0;

        // Shift for superclass as first value is superclass ptr
        if (fieldType.hasSuperClass)
            rootOffset += 1;

        // Offset the vtable reference.
        if (type.dynamicDispatch)
            rootOffset += 1;

        const offset = rootOffset + relativeFieldOffset;

        const fieldPtr = context.builder.createInBoundsGEP(
            value,
            [
                llvm.ConstantInt.get(context.ctx, 0),
                llvm.ConstantInt.get(context.ctx, offset)
            ]
        );

        return new ValueRef(fieldPtr, { isPtr: true });
    }
}
