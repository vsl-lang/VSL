import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';
import tryGenerateCast from '../helpers/tryGenerateCast';

export default class LLVMCastExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.CastExpression;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const typeContext = context.typeContext;

        const targetTy = node.targetTy.contextualType(typeContext);
        const valueTy = node.valueTy.contextualType(typeContext);

        const value = regen('value', node, context);

        // If this is an UPCAST then we'll need to see if:
        //   1) to `Object`: wrap in `Object` ty.
        //   2) to Superclass: GEP 1st param

        return tryGenerateCast(value, valueTy, targetTy, context);
    }
}
