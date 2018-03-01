import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMReturnStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ReturnStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        if (node.expression === null) {
            context.builder.createRetVoid();
        } else {
            context.builder.createRet(
                regen('expression', node, context)
            );
        }
    }
}
