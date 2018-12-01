import t from '../../../parser/nodes';
import LLVMContext from '../LLVMContext';
import ScopeEnumComparatorFuncItem from '../../../scope/items/scopeEnumComparatorFuncItem';
import { generateEnumerationComparator } from './EnumerationHelpers';

/**
 * Returns the function as an LLVM object.
 * @param {ScopeFuncItem} func
 * @param {LLVMContext} context - You probably want to give a clean context
 *                              using `context.bare()`
 * @param {Function} regen
 * @return {llvm.Function}
 */
export default function getFunctionInstance(func, context, regen) {
    if (func instanceof ScopeEnumComparatorFuncItem) {
        return generateEnumerationComparator(func, context);
    } else {
        const node = func.source;
        return regen(node.relativeName, node.parentNode, context)
    }
}
