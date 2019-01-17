import getOrInsertFunction from '../helpers/getOrInsertFunction';
import * as llvm from 'llvm-node';
import ASTTool from '../../../transform/asttool';

/**
 * Generates a critical trap.
 * @param {string} string - Trap message to display
 * @param {?llvm.Type} returnTy - LLVM type to generate garbage return of. If
 *                              null then nothing is returned and unreachable is
 *                              created.
 * @param {Node} node - Near by node generating this trap
 * @param {LLVMContext} context - LLVM context
 */
export default function generateTrap(string, returnTy, node, context) {
    const trap = getOrInsertFunction(
        context,
        'llvm.trap',
        llvm.FunctionType.get(llvm.Type.getVoidTy(context.ctx), [], false),
        llvm.LinkageTypes.ExternalLinkage
    );

    const puts = getOrInsertFunction(
        context,
        'puts',
        llvm.FunctionType.get(
            llvm.Type.getInt32Ty(context.ctx),
            [
                llvm.Type.getInt8PtrTy(context.ctx)
            ],
            false
        ),
        llvm.LinkageTypes.ExternalLinkage
    );

    const stream = ASTTool.getToolFor(node).stream?.sourceName || "<unknown>";

    const llvmStr = context.builder.createGlobalStringPtr(`vsl abort: ${string} (${stream}:${node.position.line}:${node.position.column})`);
    context.builder.createCall(puts, [ llvmStr ]);

    context.builder.createCall(trap, []);

    if (returnTy) {
        return context.builder.createLoad(context.builder.createAlloca(returnTy));
    }
}
