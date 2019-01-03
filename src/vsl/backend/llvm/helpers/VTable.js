import * as llvm from 'llvm-node';
import getFunctionType from './getFunctionType';
import * as RTTI from './RTTI';

/**
 * Returns type of the VTable for a class
 * @param {ScopeTypeItem} item - The class to generate VTable type for
 * @param {LLVMContext} context
 * @return {llvm.Type}
 */
export function getVTableTy(item, context) {
    const vtableMethods = [...item.rootDynamicMethods()];
    const vtableTyName = `${item.uniqueName}.VTable.Type`;

    let existingType = context.module.getTypeByName(vtableTyName);
    if (existingType) return existingType;

    const struct = llvm.StructType.create(context.ctx, vtableTyName)

    let newCtx = context.bare();
    newCtx.typeContext = context.typeContext.merge(item.getTypeContext());

    struct.setBody(
        [
            RTTI.getMetaTypeTy(context).getPointerTo(),
            ...vtableMethods.map(
                method =>
                    getFunctionType(method, newCtx).getPointerTo())
        ],
        /* isPacked: */ false
    );

    return struct;
}

/**
 * Given a type, returns the value of the RTTI instance.
 * @param {llvm.Value} value - Pointer to vtable.
 * @param {LLVMContext} context - The context.
 * @return {llvm.Value} the pointer to RTTI metatype ptr.
 */
export function getRTTIOffsetInVTable(value, context) {
    return context.builder.createInBoundsGEP(
        value,
        [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 0)
        ],
        'vtable.rtti.extract'
    );
}

/**
 * Given a type and a method, returns the VTable offset in that type. You will
 * need to manually dereference it.
 * @param {llvm.Value} value - The vtable ptr
 * @param {ScopeTypeItem} item - The class which method must be root decl of
 * @param {ScopeFuncItem} method - The method
 * @param {LLVMContext} context - To build in
 * @return {llvm.Value} the func
 * @throws {TypeError} if method not found.
 */
export function getMethodOffsetInVTable(value, item, method, context) {
    const vtableMethods = [...item.rootDynamicMethods()];
    const index = vtableMethods.indexOf(method);

    if (index === -1) {
        throw new TypeError(
            `Couldn't find VTable method ${method} in ${item}.`
        );
    }

    return context.builder.createInBoundsGEP(
        value,
        [
            llvm.ConstantInt.get(context.ctx, 0),
            llvm.ConstantInt.get(context.ctx, 1 + index)
        ],
        'vtable.method.extract'
    );
}
