import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import ScopeGenericSpecialization from '../../../scope/items/scopeGenericSpecialization';
import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import tryGenerateCast from './tryGenerateCast';

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
        .map(
            alias => alias.type.contextualType(typeContext))
        .map(
            fieldType => toLLVMType(fieldType, context));


    const superClassTypes = type.hasSuperClass ? [layoutType(type.superclass, context)] : [];

    // Convert all fields to LLVM types.
    let layout = [
        ...superClassTypes,
        ...fieldTypes
    ];

    structType.setBody(
        layout,
        false
    );

    return structType;
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

    const offset = rootOffset + fieldType.subscope.aliases.indexOf(field);

    return context.builder.createInBoundsGEP(
        value,
        [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, offset)
        ]
    );
}
