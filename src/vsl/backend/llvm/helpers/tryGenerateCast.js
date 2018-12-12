import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import { getObjectForValue } from './RTTI';
import toLLVMType from './toLLVMType'

/**
 * This attempts to generate an UPCAST to a type that is KNOWN to work.
 *
 * @param {llvm.Value} value - The value to cast
 * @param {ScopeTypeItem} valueTy - type of the value in VSL
 * @param {ScopeTypeItem} targetTy - the target ty of the value
 * @param {LLVMContext} context
 * @return {llvm.Value}
 * @throws {TypeError} if something is wrong
 */
export default function tryGenerateCast(value, valueTy, targetTy, context) {
    if (!valueTy.castableTo(targetTy) && targetTy !== ScopeTypeItem.RootClass) {
        throw new TypeError(
            `Attempted to generate unrelated upcast from ${valueTy} to ` +
            `${targetTy}. Report this error.`
        );
    }

    if (valueTy.castableTo(targetTy) === 0) {
        return value;
    }

    if (targetTy === ScopeTypeItem.RootClass) {
        // If its cast to object we'll wrap it in Object.
        return getObjectForValue(value, valueTy, context);
    } else {
        throw new TypeError('not supported yet.');
    }
}
