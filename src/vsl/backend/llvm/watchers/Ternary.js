import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';

import toLLVMType from '../helpers/toLLVMType';

import * as llvm from "llvm-node";

export default class LLVMTernaryExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.Ternary;
    }

    receive(node, tool, regen, context) {
        const condition = regen('condition', node, context);

        let trueBlock = llvm.BasicBlock.create(context.ctx, 'ternary.true', context.parentFunc);
        let falseBlock = llvm.BasicBlock.create(context.ctx, 'ternary.false', context.parentFunc);
        let exit = llvm.BasicBlock.create(context.ctx, 'ternary.done', context.parentFunc);

        context.builder.createCondBr(condition, trueBlock, falseBlock);

        context.builder.setInsertionPoint(trueBlock);
        const trueValue = regen('ifTrue', node, context);
        context.builder.createBr(exit);

        context.builder.setInsertionPoint(falseBlock);
        const falseValue = regen('ifFalse', node, context);
        context.builder.createBr(exit);

        context.builder.setInsertionPoint(exit);

        if (!node.type) {
            throw new BackendError(
                `Ambiguous type for this ternary node.`,
                node
            );
        }

        const phi = context.builder.createPhi(
            toLLVMType(node.type, context),
            2
        );

        phi.addIncoming(trueValue, trueBlock);
        phi.addIncoming(falseValue, falseBlock);

        return phi;
    }
}
