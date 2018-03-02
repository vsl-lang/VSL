import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';

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
 * @param {LLVMBackend} backend
 */
export default function layoutType(type, backend) {
    const { context, module } = backend;
    const typeName = type.uniqueName;

    let existingType = module.getTypeByName(typeName);
    if (existingType) return existingType;

    let structType = llvm.StructType.create(
        context,
        typeName
    );

    // Convert all fields to LLVM types.
    let layout = type.subscope.aliases.map(
        field => toLLVMType(field.type, backend)
    );

    structType.setBody(
        layout,
        false
    )

    return structType;
}
