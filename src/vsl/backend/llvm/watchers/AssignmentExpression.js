import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';
import toLLVMType from '../helpers/toLLVMType';
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
        lvalueCtx.lvalueContext = true;

        const target = regen('target', node, lvalueCtx)
        const value = regen('value', node, context);

        // Just for double-safety
        if (!(target instanceof ValueRef)) {
            throw new BackendError(
                `Internal Error: Left-hand side did not resolve to a value reference.`,
                node
            );
        }

        target.setValueTo(value, context);

        return value;
    }
}
