import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMDoWhileStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.DoWhileStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const iteration = llvm.BasicBlock.create(backend.context, 'iteration', context.parentFunc);
        const endBlock = llvm.BasicBlock.create(backend.context, 'endBlock', context.parentFunc);

        context.builder.createBr(iteration);

        context.builder.setInsertionPoint(iteration);

        regen('body', node, context);
        context.builder.createCondBr(
            regen('condition', node, context),
            iteration,
            endBlock
        );

        context.builder.setInsertionPoint(endBlock);
    }
}
