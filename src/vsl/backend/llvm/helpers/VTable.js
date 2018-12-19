import * as llvm from 'llvm-node';


/**
 * Returns type of the VTable for a class
 * @param {ScopeTypeItem} item - The class to generate VTable type for
 * @param {LLVMContext} context
 * @type {llvm.Type}
 */
export function getVTableTy(item, context) {
    const amountOfVTableMethods = 1;
    return llvm.ArrayType.get(llvm.getInt8PtrTy(context.ctx), amountOfVTableMethods);
}

/**
 * Generates vtable
 * @param {ScopeTypeItem} item - The class to generate VTable for
 * @param {LLVMContext} context
 * @return {llvm.Value} global vtable const
 */
export function getVTableForClass(item, context) {
    const vtableName = `${item.uniqueName}.VTable`;

    const existingVTable = context.module.getGlobalVariable(vtableName, true);
    if (existingVTable) return existingVTable;

    // Global variable with fields;
    const vtableTy = getVTableTy(item, context);
    const vtable = new llvm.GlobalVariable(
        context.module,
        vtableTy,
        true,
        llvm.LinkageTypes.LinkOnceODRLinkage,
        llvm.ConstantArray.get(
            vtableTy,
            []
        ),
        vtableName
    );

    return vtable;
}
