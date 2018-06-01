import * as llvm from 'llvm-node';

/**
 * Gets or inserts a struct type
 *
 * @param {LLVMContext} context - LLVM context from watcher
 * @param {string} name - The name of the type
 * @param {?llvm.Type[]} types - List of LLVM types. Null means opaque
 * @param {boolean} [isPacked=false] - if it is a packed struct
 * @return {llvm.StructType} The existing or created struct type.
 */
export default function getOrInsertStructType(context, name, types, isPacked = false) {
    let existingType = context.module.getTypeByName(name);
    if (existingType) return existingType;

    let structType = llvm.StructType.create(
        context.ctx,
        name
    );

    if (types !== null) {
        structType.setBody(
            types,
            isPacked
        );
    }

    return structType;
}
