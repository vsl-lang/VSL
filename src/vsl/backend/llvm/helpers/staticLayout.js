import toLLVMType from './toLLVMType';
import * as llvm from 'llvm-node';

/**
 * Returns layout of a static variable list
 *
 * @param {ScopeTypeItem} type - List of fields
 * @param {LLVMBackend} backend
 * @return {llvm.StructType}
 */
export function staticLayout(type, backend) {
    const fields = type.staticScope.aliases;
    const typeArr = [];

    for (let i = 0; i < fields.length; i++) {
        typeArr.push(toLLVMType(fields[i].type, backend));
    }

    return llvm.StructType.get(backend.context, typeArr, false);
}

/**
 * Gets the name of a static type
 * @param {ScopeTypeItem} type - Type to static of.
 * @return {string}
 */
export function getStaticName(type) {
    return type.uniqueName + '.static';
}
