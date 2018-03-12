import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';
import toLLVMType from '../helpers/toLLVMType';
import * as llvm from 'llvm-node';

export default class LLVMAssignmentStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.AssignmentStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // They are three types of AssignmentStatements:
        //  - Global: global variables
        //  - Static: class X { static let ... }
        //  - Instance: class X { let ... }
        //  - Scope: let x = ...
        // Static & instance are handled by ClassStatement. In this watcher,
        //  only global & scope are handled.

        // If we are an external() function we will handle seperately.
        if (node.value instanceof t.ExternalMarker) {
            const nodeName = node.value.rootId;

            // Return if already constructed
            const globalVariable = backend.module.getGlobalVariable(nodeName, true);
            if (globalVariable) return globalVariable;

            const globalType = toLLVMType(node.ref.type, backend);
            let varRef = new llvm.GlobalVariable(
                backend.module,
                globalType,
                node.type === t.AssignmentType.Constant,
                llvm.LinkageTypes.ExternalLinkage,
                undefined,
                nodeName
            );

            return node.ref.backendRef = new ValueRef(varRef, true);
        } else if (node.value instanceof t.ExpressionStatement) {
            if (node.isGlobal) {
                const name = node.ref.uniqueName;
                const type = toLLVMType(node.ref.type, backend);

                let varRef = new llvm.GlobalVariable(
                    backend.module,
                    type,
                    node.type === t.AssignmentType.Constant,
                    llvm.LinkageTypes.InternalLinkage,
                    llvm.UndefValue.get(type),
                    name
                );

                backend.addInitTask(InitPriority.GLOBAL_VAR, (context) => {
                    let res = regen('value', node, context);
                    context.builder.createStore(res, varRef);
                })

                return node.ref.backendRef = new ValueRef(varRef, true);
            } else {
                return node.ref.backendRef = new ValueRef(regen('value', node, context), false);
            }
        } else {
            throw new BackendError(
                `Could not compile assignment statement with unsupported value.`,
                node
            );
        }
    }
}
