import * as llvm from "llvm-node";

import LLVMContext from '../LLVMContext';

/**
 * Implements a priority map for LLVM 'dtors' and 'ctors'
 * @param {Map<string, Function[]>} tasks
 * @param {LLVMBackend} backend Backend instance
 * @param {string} name - Name of the global variable
 * @param {string} prefix - Function prefix
 */
export default function generatePriorityMap(tasks, backend, name, prefix) {
    const taskType = llvm.FunctionType.get(
        llvm.Type.getVoidTy(backend.context),
        [],
        false
    );

    const taskInstance = llvm.StructType.create(backend.context);
    taskInstance.setBody([
        llvm.Type.getInt32Ty(backend.context),
        taskType.getPointerTo(),
        llvm.Type.getInt8PtrTy(backend.context)
    ])

    let taskImplementations = [];
    for (let [priority, funcs] of tasks) {
        const taskFunc = llvm.Function.create(
            taskType,
            llvm.LinkageTypes.InternalLinkage,
            `vsl.${prefix}.${priority}`,
            backend.module
        );

        taskImplementations.push(
            llvm.ConstantStruct.get(
                taskInstance,
                [
                    llvm.ConstantInt.get(backend.context, 65535 - priority, 32),
                    taskFunc,
                    llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(backend.context))
                ]
            )
        );

        const taskBlock = llvm.BasicBlock.create(
            backend.context,
            'entry',
            taskFunc
        );

        const taskBuilder = new llvm.IRBuilder(taskBlock);

        // Create init
        const context = new LLVMContext(backend);
        context.builder = taskBuilder;
        context.parentFunc = taskFunc;

        // Go backwards
        for (let i = 0; i < funcs.length; i++) {
            funcs[i](context);
        }

        taskBuilder.createRetVoid();
    }

    const taskStructType = llvm.ArrayType.get(taskInstance, taskImplementations.length);

    // Add global var
    new llvm.GlobalVariable(
        backend.module,
        taskStructType,
        false,
        llvm.LinkageTypes.AppendingLinkage,
        llvm.ConstantArray.get(taskStructType, taskImplementations),
        name
    );
}
