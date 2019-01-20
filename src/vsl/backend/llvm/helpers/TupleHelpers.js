import * as llvm from 'llvm-node';
import toLLVMType from './toLLVMType';

/**
 * Lays out a tuple
 * @param {ScopeTupleItem} tuple
 * @param {LLVMContext} context
 * @return {llvm.Type}
 */
export function layoutTuple(tuple, context) {
    const typeName = tuple.uniqueName;

    const existingType = context.module.getTypeByName(typeName);
    if (existingType) return existingType.getPointerTo();

    const structType = llvm.StructType.create(
        context.ctx,
        typeName
    );

    const layout = tuple.subscope
        .aliases
        .map(alias => toLLVMType(alias.type, context));

    structType.setBody(layout, false);

    return structType.getPointerTo();
}

/**
 * Gets index in tuple struct
 * @param {ScopeAliasItem} field
 * @param {ScopeTupleItem} tuple
 * @return {number} index starting at zero
 * @throws {TypeError} if `field` is not in `tuple`.
 */
export function getFieldOffset(field, tuple) {
    const index = tuple.subscope.aliases.indexOf(field);

    if (index === -1) {
        throw new TypeError(`Could not get field offset of ${field} in ${tuple}`);
    }

    return index;
}
