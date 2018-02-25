import * as llvm from 'llvm-node';

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
 */
export default function layoutType(type, context) {
    let uniqueProperties = [];
    let structType = llvm.StructType.get(
        context,
        uniqueProperties,
        type.uniqueName
    );
    return structType;
}
