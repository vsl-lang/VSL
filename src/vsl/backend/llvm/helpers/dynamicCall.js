import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionInstance from '../helpers/getFunctionInstance';
import tryGenerateCast from '../helpers/tryGenerateCast';
import { getVTableOffset } from '../helpers/layoutType';
import { getMethodOffsetInVTable } from '../helpers/VTable';

/**
 * Creates a call potentially with dynamic dispatch
 * @param {Object} o - Options
 * @param {llvm.Value[]} o.params - The provided parameters
 * @param {?llvm.Value} o.self - A self parameter if applicable
 * @param {ScopeFuncItem} o.func - The function resolved
 * @param {LLVMContext} context
 * @return {llvm.Value} return value if applicable.
 */
export default function dynamicCall({ params, self, func }, context) {

}
