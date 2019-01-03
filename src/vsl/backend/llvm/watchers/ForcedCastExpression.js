import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';
import tryGenerateCast, { validateRuntimeCast } from '../helpers/tryGenerateCast';
import generateTrap from '../helpers/generateTrap';

export default class LLVMForcedCastExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.ForcedCastExpression;
    }

    receive(node, tool, regen, context) {
        const typeContext = context.typeContext;

        const targetType = node.targetTy.contextualType(typeContext);
        const valueType = node.valueTy.contextualType(typeContext);

        const targetTy = toLLVMType(targetType, context);

        const value = regen('value', node, context);

        if (valueType.castableTo(targetType)) {
            // If cast always succeeds.
            context.backend.warn(
                new BackendWarning(
                    `Cast always succeeds, consider using \`as\``,
                    node
                )
            );

            return tryGenerateCast(value, valueType, targetType, context);
        } else if (!valueType.isInterface && !targetType.castableTo(valueType)) {
            // If we have `x: T` and do `x as! U` if `U is T == false` then cast
            // will always fail given `U` is not an interface.
            context.backend.warn(
                new BackendWarning(
                    `OO-downcast will alway fail.`,
                    node
                )
            );

            return generateTrap(`failed to force cast ${valueType} to ${targetType}`, targetTy, node, context);
        } else {
            // TODO: more complex checks
            return generateTrap(`failed to force cast ${valueType} to ${targetType}`, targetTy, node, context);
        }
    }
}
