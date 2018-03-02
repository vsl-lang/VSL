import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMIfStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.IfStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const curBlock = context.builder.getInsertBlock();

        const trueBlock = llvm.BasicBlock.create(backend.context, 'true', context.parentFunc);
        const endBlock = llvm.BasicBlock.create(backend.context, 'finally', context.parentFunc);

        // False block is same as end block if no else { ... }
        const falseBlock = node.falseBody ?
            llvm.BasicBlock.create(backend.context, 'else', context.parentFunc) :
            endBlock

        // Create the condition ? trueBlock : endBlock
        let condBr = context.builder.createCondBr(
            regen('condition', node, context),
            trueBlock, falseBlock
        );

        // Generate the conditional block
        this.generateConditionalBlock(node, 'trueBody', trueBlock, endBlock, regen, context);

        // Generate the else block if needed
        if (falseBlock !== endBlock) {
            this.generateConditionalBlock(node, 'falseBody', falseBlock, endBlock, regen, context);
        }

        context.builder.setInsertionPoint(endBlock);
        return condBr;
    }


    generateConditionalBlock(parent, name, block, endBlock, regen, context) {
        context.builder.setInsertionPoint(block);
        regen(name, parent, context);

        // If there is a terminator, we won't add the break
        if (block.getTerminator()) { return }
        context.builder.createBr(endBlock);
    }
}
