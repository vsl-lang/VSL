import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMWhileStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.WhileStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const cond = llvm.BasicBlock.create(backend.context, 'cond', context.parentFunc);
        const endBlock = llvm.BasicBlock.create(backend.context, 'done', context.parentFunc);
        const whileLoop = llvm.BasicBlock.create(backend.context, 'while', context.parentFunc)

        context.builder.createBr(cond);

        context.builder.setInsertionPoint(cond);
        context.builder.createCondBr(
            regen('condition', node, context),
            whileLoop,
            endBlock
        );

        context.builder.setInsertionPoint(whileLoop);
        regen('body', node, context);
        context.builder.createBr(cond);

        context.builder.setInsertionPoint(endBlock);
    }
}
