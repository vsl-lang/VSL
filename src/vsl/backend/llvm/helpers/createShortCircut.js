import * as llvm from 'llvm-node';

/**
 * Helper to create short-circut. Internally creates or-like expression if expr1
 * and expr1 are true-fallthrough
 *
 * @param {Expression} expr1 - The first expression
 * @param {Function} expr2 - Function taking context parameter, returning expr.
 * @param {LLVMContext} context - The parent context.
 */
export default function createShortCircut(expr1, expr2, context) {
    let trueBlock = context.builder.getInsertBlock();
    let falseBlock = llvm.BasicBlock.create(context.backend.context, 'sc.b', context.parentFunc);
    let exit = llvm.BasicBlock.create(context.backend.context, 'sc.c', context.parentFunc);

    context.builder.createCondBr(
        expr1,
        exit,
        falseBlock
    );

    context.builder.setInsertionPoint(falseBlock);
    let expr2value = expr2(context);
    context.builder.createBr(exit);

    context.builder.setInsertionPoint(exit);
    let phi = context.builder.createPhi(llvm.Type.getInt1Ty(context.backend.context), 2);
    phi.addIncoming(expr1, trueBlock);
    phi.addIncoming(expr2value, falseBlock);
    return phi;
}
