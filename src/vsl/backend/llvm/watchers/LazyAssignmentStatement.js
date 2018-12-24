import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import toLLVMType from '../helpers/toLLVMType';
import * as llvm from 'llvm-node';

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

        const varType = toLLVMType(aliasItem.type, context);
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

        const funcType = llvm.FunctionType.get(varType, [], false);
        const func = llvm.Function.create(
            funcType,
            llvm.LinkageTypes.InternalLinkage,
            varName,
            backend.module
        );

        const block = llvm.BasicBlock.create(backend.context, 'entry', func);
        const builder = new llvm.IRBuilder(block);

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

        const doReturn = llvm.BasicBlock.create(backend.context, 'value', func);
        builder.setInsertionPoint(doReturn);
        builder.createRet(builder.createLoad(internalValue));

        const doInitialize = llvm.BasicBlock.create(backend.context, 'noinit', func);
        builder.setInsertionPoint(doInitialize);

        const newCtx = context.bare();
        newCtx.builder = builder;
        newCtx.parentFunc = func;

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

        builder.setInsertionPoint(block);
        const condBr = builder.createCondBr(
            builder.createICmpEQ(
                builder.createLoad(initializationStatus),
                llvm.ConstantInt.getTrue(backend.context)
            ),
            doReturn,
            doInitialize
        );

        aliasItem.backendRef = new ValueRef(func, {
            isDyn: true,
            aggregateSetter: 1,
            backingValue: backingValue,
            didSet: (value, context) => {
                // Make sure lazy status is true
                context.builder.createStore(
                    llvm.ConstantInt.getTrue(context.backend.context),
                    context.builder.createInBoundsGEP(
                        value,
                        [
                            llvm.ConstantInt.get(context.backend.context, 0),
                            llvm.ConstantInt.get(context.backend.context, 0)
                        ]
                    )
                );
            }
        });
    }
}
