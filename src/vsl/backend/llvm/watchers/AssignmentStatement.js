import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';
import toLLVMType from '../helpers/toLLVMType';
import * as llvm from 'llvm-node';

import TypeContext from '../../../scope/TypeContext';

import tryGenerateCast from '../helpers/tryGenerateCast';

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
            // Don't compile external variables multiple times

            if (node.reference.backendRef) return node.reference.backendRef;

            const nodeName = node.value.rootId;

            // Return if already constructed
            const globalVariable = backend.module.getGlobalVariable(nodeName, true);
            if (globalVariable) return;

            const globalType = toLLVMType(node.reference.type, context);
            let varRef = new llvm.GlobalVariable(
                backend.module,
                globalType,
                node.type === t.AssignmentType.Constant,
                llvm.LinkageTypes.ExternalLinkage,
                undefined,
                nodeName
            );

            const variableReference = new ValueRef(varRef, { isPtr: true });
            node.reference.backendRef = variableReference;
            return variableReference;
        } else if (node.value instanceof t.ExpressionStatement) {
            if (node.isGlobal) {
                // Don't compile global variables multiple times
                if (node.reference.backendRef) return node.reference.backendRef;

                const name = node.reference.uniqueName;
                const type = toLLVMType(node.reference.type, context);

                let varRef = new llvm.GlobalVariable(
                    backend.module,
                    type,
                    false,
                    llvm.LinkageTypes.InternalLinkage,
                    llvm.UndefValue.get(type),
                    name
                );

                backend.addInitTask(InitPriority.GLOBAL_VAR, (context) => {
                    const expressionValue = regen('value', node, context);

                    const res = tryGenerateCast(
                        expressionValue,
                        node.value.type,
                        node.reference.type,
                        context
                    );

                    context.builder.createStore(res, varRef);
                });

                const variableReference = new ValueRef(varRef, { isPtr: true });
                node.reference.backendRef = variableReference;
                return variableReference;
            } else {
                // A simple, local assignment expression

                const expressionValue = regen('value', node, context);
                const value = tryGenerateCast(
                    expressionValue,
                    node.value.type,
                    node.reference.type,
                    context
                );

                const alloca = context.builder.createAlloca(value.type);
                context.builder.createStore(value, alloca);

                // Check if the value type is a by-value
                const variableReference = new ValueRef(alloca, { isPtr: true });
                node.reference.backendRef = variableReference;
                return variableReference;
            }
        } else {
            throw new BackendError(
                `Could not compile assignment statement with unsupported value.`,
                node
            );
        }
    }
}
