import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';
import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';

import * as llvm from 'llvm-node';

export default class LLVMClassStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ClassStatement;
    }

    receive(node, tool, regen, context) {
        // TODO: Support generics
        if (node.generics.length !== 0) return;

        const backend = context.backend;
        const classRef = node.reference;

        // Generate all fields into the global object.
        const staticItems = classRef.staticScope.aliases;

        for (let i = 0 ; i < staticItems.length; i++) {
            const staticVarName = `${classRef.uniqueName}.${staticItems[i].uniqueName}`;
            if (backend.module.getGlobalVariable(staticVarName, true)) continue;

            if (staticItems[i].source.value instanceof t.ExpressionStatement) {
                let type = toLLVMType(staticItems[i].type, backend);
                let globalVar = new llvm.GlobalVariable(
                    backend.module,
                    type,
                    false,
                    llvm.LinkageTypes.PrivateLinkage,
                    llvm.UndefValue.get(type),
                    staticVarName
                );

                staticItems[i].backendRef = new ValueRef(globalVar, { isPtr: true });

                backend.addInitTask(InitPriority.STATIC_VAR, (context) => {
                    context.builder.createStore(
                        regen('value', staticItems[i].source, context),
                        globalVar
                    );
                });
            } else {
                let externalValue = regen(staticItems[i].source.relativeName, staticItems[i].source.parentNode, context);
                staticItems[i].backendRef = new ValueRef(externalValue, { isPtr: true });
            }
        }

        // Compile all methods
        for (let i = 0; i < node.statements.statements.length; i++) {
            const statement = node.statements.statements[i];
            if (statement instanceof t.FunctionStatement) {
                regen(i, node.statements.statements, context.bare());
            }
        }
    }
}
