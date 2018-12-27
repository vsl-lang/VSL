import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import { getObjectForValue } from './RTTI';
import toLLVMType from './toLLVMType';
import * as llvm from 'llvm-node';

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

    const castDistance = valueTy.castableTo(targetTy) - 1;

    // If there is no distance between current and target type.
    if (castDistance === 0) {
        return value;
    }

    if (targetTy === ScopeTypeItem.RootClass) {
        // If its cast to object we'll wrap it in Object.
        return getObjectForValue(value, valueTy, context);
    } else {
        // Otherwise we'll do an upcast based on if it is interface or a
        // superclass.
        if (!targetTy.isInterface) {
            // Casting to a superclass. Essentially we can dereference the first
            // part until we reach the class.

            let lastInstance = value;
            for (let i = 0; i < castDistance; i++) {
                lastInstance = context.builder.createInBoundsGEP(
                    lastInstance,
                    [
                        llvm.ConstantInt.get(context.ctx, 0),
                        llvm.ConstantInt.get(context.ctx, 0)
                    ],
                    'superclass.extract'
                );
            }

            return lastInstance;
        } else {
            throw new TypeError(
                `Cannot cast to interface yet.`
            );
        }
    }
}

/**
 * This validates a cast. _Always_ call this before actually downcasting unless
 * you like runtime segfaults. You can also use this to check if an object is
 * a class at runtime.
 *
 * @param {llvm.Value} value - The value
 * @param {ScopeTypeItem} sourceType - The source type
 * @param {ScopeTypeItem} targetType - The type to check if compatible.
 * @param {LLVMContext} context
 * @return {llvm.Value} value with value.
 */
export function validateRuntimeCast(value, sourceType, targetType, context) {

}
