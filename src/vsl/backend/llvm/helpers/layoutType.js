import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';
import ScopeGenericSpecialization from '../../../scope/items/scopeGenericSpecialization';
import ScopeTypeItem from '../../../scope/items/scopeTypeItem';

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
 * @param {ScopeTypeItem} type  type
 * @param {ScopeAliasItem} field field name
 * @return {number} positive integer 0+ if found. -1 if not
 */
export function getTypeOffset(type, field) {
    let rootOffset = 0;

    if (type.hasSuperClass)
        rootOffset += 1;

    return rootOffset + type.subscope.aliases.indexOf(field);
}
