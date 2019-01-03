import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import ScopeGenericSpecialization from '../../../scope/items/scopeGenericSpecialization';
import ScopeDynFieldItem from '../../../scope/items/scopeDynFieldItem';
import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import tryGenerateCast from './tryGenerateCast';
import { getVTableTy } from './VTable';

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
    const { context: ctx, module } = context.backend;
    const typeName = type.uniqueName;
    const typeContext = type.getTypeContext();

    let existingType = module.getTypeByName(typeName);
    if (existingType) return existingType;

    let structType = llvm.StructType.create(
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
        layoutType(
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
 * Returns the offset of a field in a type
 * @param {llvm.Value} value - Input value
 * @param {ScopeTypeItem} type - Type of input value
 * @param {ScopeAliasItem} field - field reference
 * @param {LLVMContext} context - Same context to build in
 * @return {llvm.Value} value of field pointer
 * @throws {TypeError} if field is not found.
 */
export function getTypeOffset(value, type, field, context) {
    // Get field owner
    const fieldType = field.owner.owner;

    let rootOffset = 0;

    if (fieldType.hasSuperClass)
        rootOffset += 1;

    if (type.dynamicDispatch)
        rootOffset += 1;

    const offset = rootOffset + fieldType.subscope
        .aliases
        .filter(alias => !(alias instanceof ScopeDynFieldItem))
        .indexOf(field);

    return context.builder.createInBoundsGEP(
        value,
        [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, offset)
        ]
    );
}
