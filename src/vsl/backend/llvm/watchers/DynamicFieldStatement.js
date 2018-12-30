import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import toLLVMType from '../helpers/toLLVMType';
import * as llvm from 'llvm-node';
import tryGenerateCast from '../helpers/tryGenerateCast';

export default class LLVMDynamicFieldStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.DynamicFieldStatement;
    }

    receive(node, tool, regen, context) {
        const item = node.reference;
        const typeContext = context.typeContext;
        const fieldType = node.type.contextualType(typeContext);
        const fieldTy = toLLVMType(fieldType, context);

        const parentClassType = item.owner.owner.selfType.contextualType(typeContext);
        const parentClassTy = toLLVMType(parentClassType, context);
        const isField = !tool.isStatic;
        const hasSelf = isField;

        const rootName = item.uniqueName + typeContext.getMangling();
        const getterName = `${rootName}.getter`;
        const setterName = `${rootName}.setter`;

        // Create getter
        const existingGetter = context.module.getFunction(getterName);
        let getter = null;
        if (existingGetter) {
            getter = existingGetter;
        } else if (node.getter) {
            const getterType = llvm.FunctionType.get(fieldTy, hasSelf ? [parentClassTy] : [], false);
            getter = llvm.Function.create(getterType, llvm.LinkageTypes.InternalLinkage, getterName, context.module);

            getter.addFnAttr(llvm.Attribute.AttrKind.InlineHint);

            const entryBlock = llvm.BasicBlock.create(context.ctx, 'entry', getter);
            const entryBuilder = new llvm.IRBuilder(entryBlock);

            const getterContext = context.bare();
            getterContext.builder = entryBuilder;
            getterContext.parentFunc = getter;
            getterContext.selfReference = hasSelf ? getter.getArguments()[0] : null;
            getterContext.typeContext = typeContext;
            regen('body', node.getter, getterContext);
        }

        // Create setter
        const existingSetter = context.module.getFunction(setterName);
        let setter = null;
        if (existingSetter) {
            setter = existingSetter;
        } else if (node.setter) {
            const setterType = llvm.FunctionType.get(llvm.Type.getVoidTy(context.ctx), hasSelf ? [fieldTy, parentClassTy] : [fieldTy], false);
            setter = llvm.Function.create(setterType, llvm.LinkageTypes.InternalLinkage, setterName, context.module);

            setter.addFnAttr(llvm.Attribute.AttrKind.InlineHint);

            const entryBlock = llvm.BasicBlock.create(context.ctx, 'entry', setter);
            const entryBuilder = new llvm.IRBuilder(entryBlock);

            const setterContext = context.bare();
            setterContext.builder = entryBuilder;
            setterContext.parentFunc = setter;
            setterContext.selfReference = hasSelf ? setter.getArguments()[1] : null;
            setterContext.typeContext = typeContext;

            node.setter.parameterRef.backendRef = new ValueRef(setter.getArguments()[0], { isPtr: false });
            regen('body', node.setter, setterContext);
            setterContext.builder.createRetVoid();
        }

        return new ValueRef(getter, {
            isDyn: true,
            instance: hasSelf,
            didSet: (value, context, self) => {
                context.builder.createCall(
                    setter,
                    hasSelf ? [value, self] : [value]
                );

                return value;
            }
        });
    }
}
