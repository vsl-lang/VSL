import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { staticLayout, getStaticName } from '../helpers/staticLayout';

import * as llvm from 'llvm-node';

export default class LLVMClassStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ClassStatement;
    }

    receive(node, tool, regen, context) {
        // TODO: Support generics
        if (node.generics.length !== 0) return;

        const backend = context.backend;

        const classRef = node.scopeRef;

        // Generate all fields into the global object.
        const staticItems = classRef.staticScope.aliases;
        const staticObjName = getStaticName(classRef);

        let staticObj = backend.module.getGlobalVariable(staticObjName, true);
        if (!staticObj) {
            const staticType = staticLayout(classRef, backend);
            staticObj = new llvm.GlobalVariable(
                backend.module,
                staticType,
                false,
                llvm.LinkageTypes.PrivateLinkage,
                llvm.ConstantAggregateZero.get(staticType),
                staticObjName
            );

            // Push the builder for the static vars
            backend.initTasks.push((context) => {
                const backend = context.backend;

                for (let i = 0; i < staticItems.length; i++) {
                    let storeValue = regen('value', staticItems[i].source, context);
                    context.builder.createStore(
                        storeValue,
                        context.builder.createInBoundsGEP(
                            staticObj,
                            [
                                // Gets physical ref to var
                                llvm.ConstantInt.get(backend.context, 0),

                                // Ref to field
                                llvm.ConstantInt.get(backend.context, i),
                            ]
                        )
                    )
                }
            });
        }

        return staticObj;
    }
}
