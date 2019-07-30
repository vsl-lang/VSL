import * as llvm from "llvm-node";

import LLVMContext from '../LLVMContext';

/**
 * Implements a priority map for LLVM 'dtors' and 'ctors'
 * @param {Map<string, Function[]>} tasks
 * @param {LLVMContext} context context instance
 * @param {string} name - Name of the global variable
 * @param {string} prefix - Function prefix
 */
export default function generatePriorityMap(tasks, context, name, prefix) {
    const taskType = llvm.FunctionType.get(
        llvm.Type.getVoidTy(context.ctx),
        [],
        false
    );

    const taskInstance = llvm.StructType.create(context.ctx);
    taskInstance.setBody([
        llvm.Type.getInt32Ty(context.ctx),
        taskType.getPointerTo(),
        llvm.Type.getInt8PtrTy(context.ctx)
    ])

    let taskImplementations = [];
    for (let [priority, funcs] of tasks) {
        const taskFunc = llvm.Function.create(
            taskType,
            llvm.LinkageTypes.InternalLinkage,
            `vsl.${prefix}.${priority}`,
            context.module
        );

        taskImplementations.push(
            llvm.ConstantStruct.get(
                taskInstance,
                [
                    llvm.ConstantInt.get(context.ctx, 65535 - priority, 32),
                    taskFunc,
                    llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(context.ctx))
                ]
            )
        );

        const taskBlock = llvm.BasicBlock.create(
            context.ctx,
            'entry',
            taskFunc
        );

        const taskBuilder = new llvm.IRBuilder(taskBlock);

        // Create init
        const initCtx = context.bare();
        initCtx.builder = taskBuilder;
        initCtx.parentFunc = taskFunc;

        // Go backwards
        for (let i = 0; i < funcs.length; i++) {
            funcs[i](initCtx);
        }

        taskBuilder.createRetVoid();
    }

    const taskStructType = llvm.ArrayType.get(taskInstance, taskImplementations.length);

    // Add global var
    new llvm.GlobalVariable(
        context.module,
        taskStructType,
        false,
        llvm.LinkageTypes.AppendingLinkage,
        llvm.ConstantArray.get(taskStructType, taskImplementations),
        name
    );
}
