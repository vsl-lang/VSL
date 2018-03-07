import * as llvm from 'llvm-node';

/**
 * Tool for memory managing LLVM stuff. Abstraction point for alloc/dealloc.
 * @param {number} size - Size in bytes of memory to alloc
 * @param {LLVMContext} context
 */
export function alloc(size, context) {
    const backend = context.backend;

    // Get canonical `malloc` reference.
    const intTy = backend.module.dataLayout.getIntPtrType(backend.context, 0);

    // Get malloc
    let malloc = backend.module.getOrInsertFunction(
        'malloc',
        llvm.FunctionType.get(
            llvm.Type.getInt8PtrTy(backend.context),
            [intTy],
            false
        )
    );

    return context.builder.createCall(
        malloc,
        [llvm.ConstantInt.get(backend.context, size, intTy.bitWidth)]
    )
}
