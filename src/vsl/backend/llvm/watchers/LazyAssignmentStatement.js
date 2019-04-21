import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import toLLVMType from '../helpers/toLLVMType';
import * as llvm from 'llvm-node';
import tryGenerateCast from '../helpers/tryGenerateCast';

export default class LLVMLazyAssignmentStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.AssignmentStatement && type.isLazy;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const aliasItem = node.reference;

        // Check if global
        if (!node.isGlobal) {
            throw new BackendError(
                `Currently, only globals can be lazy initialized.`,
                node
            );
        }

        const varName = aliasItem.uniqueName;
        const backingValueName = `${varName}.value`

        // Check if already exists
        const globalVar = backend.module.getGlobalVariable(backingValueName, true);
        if (globalVar) return;

        // Get the type which the variable is
        const varType = toLLVMType(aliasItem.type, context);

        // The backing type is in the form:
        // { bool isInitialized, T value }
        // if isInitialized is false then the value will be initialized.
        const backingType = llvm.StructType.get(backend.context, [
            llvm.Type.getInt1Ty(backend.context),
            varType
        ], true);

        // Create var to store temp value
        const backingValue = new llvm.GlobalVariable(
            backend.module,
            backingType,
            false,
            llvm.LinkageTypes.PrivateLinkage,
            llvm.ConstantStruct.get(
                backingType, [
                    llvm.ConstantInt.getFalse(backend.context),
                    llvm.UndefValue.get(varType)
                ]
            ),
            backingValueName
        );

        // Create a function to access variable value
        const funcType = llvm.FunctionType.get(varType, [], false);
        const func = llvm.Function.create(
            funcType,
            llvm.LinkageTypes.InternalLinkage,
            varName,
            backend.module
        );

        const entryBlock = llvm.BasicBlock.create(backend.context, 'entry', func);
        const builder = new llvm.IRBuilder(entryBlock);

        const initializationStatus = builder.createInBoundsGEP(
            backingValue,
            [
                llvm.ConstantInt.get(backend.context, 0),
                llvm.ConstantInt.get(backend.context, 0)
            ]
        );

        const internalValue = builder.createInBoundsGEP(
            backingValue,
            [
                llvm.ConstantInt.get(backend.context, 0),
                llvm.ConstantInt.get(backend.context, 1)
            ]
        );

        // Case: already initialized
        const doReturn = llvm.BasicBlock.create(backend.context, 'value', func);
        builder.setInsertionPoint(doReturn);
        builder.createRet(builder.createLoad(internalValue));

        // Case: needs to be initialized
        const doInitialize = llvm.BasicBlock.create(backend.context, 'noinit', func);
        builder.setInsertionPoint(doInitialize);

        const newCtx = context.bare();
        newCtx.builder = builder;
        newCtx.parentFunc = func;

        // Initialize the value
        const expressionValue = regen('value', node, newCtx);
        let initVal = tryGenerateCast(
            expressionValue,
            node.value.type,
            node.reference.type,
            context
        );

        builder.createStore(initVal, internalValue);
        builder.createStore(llvm.ConstantInt.getTrue(backend.context), initializationStatus)

        builder.createRet(initVal);

        // Check which case to run
        builder.setInsertionPoint(entryBlock);
        const condBr = builder.createCondBr(
            builder.createICmpEQ(
                builder.createLoad(initializationStatus),
                llvm.ConstantInt.getTrue(backend.context)
            ),
            doReturn,
            doInitialize
        );

        // Handle setting the lazy variable
        aliasItem.backendRef = new ValueRef(func, {
            isDyn: true,
            didSet: (value, context) => {
                const ptr = context.builder.createInBoundsGEP(
                    backingValue,
                    [
                        llvm.ConstantInt.get(context.backend.context, 0),
                        llvm.ConstantInt.get(context.backend.context, 1)
                    ]
                );

                // Make sure lazy status is true
                context.builder.createStore(
                    llvm.ConstantInt.getTrue(context.backend.context),
                    context.builder.createInBoundsGEP(
                        backingValue,
                        [
                            llvm.ConstantInt.get(context.backend.context, 0),
                            llvm.ConstantInt.get(context.backend.context, 0)
                        ]
                    )
                );

                return context.builder.createStore(value, ptr);
            }
        });
    }
}
