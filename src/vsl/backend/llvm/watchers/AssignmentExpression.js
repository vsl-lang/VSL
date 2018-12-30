import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';
import LValueRef from '../LValueRef';
import InitPriority from '../InitPriority';
import toLLVMType from '../helpers/toLLVMType';
import tryGenerateCast from '../helpers/tryGenerateCast';
import * as llvm from 'llvm-node';

export default class LLVMAssignmentExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.AssignmentExpression;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        if (node.reference === null) {
            this.emit(
                `Ambiguous type of value in this assignment.`
            );
        }

        const lvalueCtx = context.clone();
        lvalueCtx.pushValue(Key.LValueContext, true);

        const target = regen('target', node, lvalueCtx)
        const value = tryGenerateCast(
            regen('value', node, context),
            node.valueReference,
            node.reference,
            context
        );

        // Just for double-safety
        if (!(target instanceof LValueRef)) {
            throw new BackendError(
                `Internal Error: Left-hand side did not resolve to a value reference.`,
                node
            );
        }

        target.property.setValueTo(value, context, target.self);

        return value;
    }
}
