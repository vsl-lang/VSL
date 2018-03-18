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
        const aliasItem = node.ref;

        // Check if global
        if (!node.isGlobal) {
            throw new BackendError(
                `Currently, only globals can be lazy initialized.`,
                node
            );
        }

        const varName = aliasItem.uniqueName;
        const varRefName = `${varName}.value`

        // Check if already exists
        const globalVar = backend.module.getGlobalVariable(varName, true);
        if (globalVar) return;

        const varType = toLLVMType(aliasItem.type, backend);
        const varTypeStore = llvm.StructType.get(
            backend.context,
            [
                llvm.Type.getInt1Ty(backend.context),
                varType
            ],
            true
        );

        // Create var to store temp value
        const tempValRef = new llvm.GlobalVariable(
            backend.module,
            varTypeStore,
            false,
            llvm.LinkageTypes.PrivateLinkage,
            llvm.ConstantAggregateZero.get(varTypeStore),
            varRefName
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

        const notInit = builder.createICmpEQ(
            builder.createLoad(builder.createInBoundsGEP(
                tempValRef,
                [
                    llvm.ConstantInt.get(backend.context, 0),
                    llvm.ConstantInt.get(backend.context, 0)
                ]
            )),
            llvm.ConstantInt.getFalse(backend.context)
        );

        const initStoreTarget = builder.createInBoundsGEP(
            tempValRef,
            [
                llvm.ConstantInt.get(backend.context, 0),
                llvm.ConstantInt.get(backend.context, 1)
            ]
        );

        const doReturn = llvm.BasicBlock.create(backend.context, 'value', func);
        builder.setInsertionPoint(doReturn);
        builder.createRet(builder.createLoad(initStoreTarget));

        const doInitialize = llvm.BasicBlock.create(backend.context, 'noinit', func);
        builder.setInsertionPoint(doInitialize);

        const newCtx = context.bare();
        newCtx.builder = builder;
        newCtx.parentFunc = func;

        let initVal = regen('value', node, newCtx);
        let initStore = builder.createStore(initVal, initStoreTarget);

        builder.createRet(initVal);

        builder.setInsertionPoint(block);
        builder.createCondBr(notInit, doInitialize, doReturn);

        aliasItem.backendRef = new ValueRef(func, {
            isDyn: true,
            aggregateSetter: 1,
            backingValue: tempValRef
        });
    }
}
