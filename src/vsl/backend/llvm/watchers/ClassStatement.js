import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import TypeContext from '../../../scope/TypeContext';
import toLLVMType from '../helpers/toLLVMType';
import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';

import * as llvm from 'llvm-node';

export default class LLVMClassStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ClassStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const classRef = node.reference;

        if (classRef.backendRef?.isCompiled) {
            return;
        }

        function generateWithTypeContext(typeContext) {
            // Generate all fields into the global object.
            const staticItems = classRef.staticScope.aliases;

            for (let i = 0 ; i < staticItems.length; i++) {
                const staticVarType = staticItems[i].type.contextualType(typeContext);
                const doesNotDependOnGenericTy = staticItems[i].type === staticVarType;

                const staticVarName = `${classRef.uniqueName}.${staticItems[i].uniqueName}${doesNotDependOnGenericTy ? "" : typeContext.getMangling()}`;
                if (backend.module.getGlobalVariable(staticVarName, true)) continue;

                if (staticItems[i].source.value instanceof t.ExpressionStatement) {
                    let type = toLLVMType(staticVarType, context);
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
                        const newContext = context.clone();
                        newContext.typeContext = newContext.typeContext.merge(typeContext);
                        newContext.builder.createStore(
                            regen('value', staticItems[i].source, newContext),
                            globalVar
                        );
                    });
                } else {
                    // Regenerate self as an assignment statement. Because this
                    // branch should only be reached for external assignments,
                    // this will essentially pass external assignment handling
                    // to the respective watcher.
                    let externalValue = regen(staticItems[i].source.relativeName, staticItems[i].source.parentNode, context);
                    staticItems[i].backendRef = new ValueRef(externalValue, { isPtr: true });
                }
            }
        }

        if (classRef.isGeneric) {
            for (const [_, specialization] of classRef.genericInfo.existingSpecializations) {
                if (specialization === classRef.selfType) continue;
                generateWithTypeContext(specialization.getTypeContext());
            }
        } else {
            generateWithTypeContext(TypeContext.empty());
        }

        classRef.backendRef = { isCompiled: true };
    }
}
