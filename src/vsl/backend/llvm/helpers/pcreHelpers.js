import * as llvm from 'llvm-node';
import getOrInsertStructType from './getOrInsertStructType';

/**
 * Gets the type of a pcre expression within a context
 * @param {LLVMContext} context the local context to generate within
 * @return {llvm.Type} the type of a pcre*
 */
export function getPcreType(context) {
    return getOrInsertStructType(
        context,
        'vsl.regex_ty',
        null
    )
}
