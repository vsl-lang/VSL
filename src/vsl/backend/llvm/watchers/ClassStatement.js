import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';
import tryGenerateCast from '../helpers/tryGenerateCast';
import ValueRef from '../ValueRef';
import InitPriority from '../InitPriority';

import ScopeDynFieldItem from '../../../scope/items/scopeDynFieldItem';

import TypeContext from '../../../scope/TypeContext';
import TypeContextConnector from '../../../scope/TypeContextConnector';

import * as llvm from 'llvm-node';

// Watcher for TYPE statements. Unlike its name this generates for BOTH classes
// AND interfaces.
export default class LLVMClassStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ClassStatement || type instanceof t.InterfaceStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const classRef = node.reference;

        if (classRef.backendRef?.isCompiled) {
            return;
        }

        const genericParameters = classRef.genericInfo.parameters;

        function generateWithTypeContext(typeContext) {
            // Generate all fields into the global object.
            const staticItems = classRef.staticScope.aliases;

            ////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////
            ///                     Static Variables                         ///
            ////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////
            for (let i = 0 ; i < staticItems.length; i++) {
                const staticVarType = staticItems[i].type.contextualType(typeContext);
                const doesNotDependOnGenericTy = staticItems[i].type === staticVarType;

                const staticVarName = `${classRef.uniqueName}.${staticItems[i].uniqueName}${doesNotDependOnGenericTy ? "" : typeContext.getMangling()}`;
                if (backend.module.getGlobalVariable(staticVarName, true)) continue;

                // Setup type context connector if not already
                if (!staticItems[i].backendRef) {
                    staticItems[i].backendRef = new TypeContextConnector(genericParameters);
                }

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

                    staticItems[i].backendRef.set(
                        typeContext,
                        new ValueRef(globalVar, { isPtr: true })
                    );

                    backend.addInitTask(InitPriority.STATIC_VAR, (context) => {
                        const newContext = context.clone();
                        newContext.typeContext = newContext.typeContext.merge(typeContext);
                        newContext.builder.createStore(
                            tryGenerateCast(
                                regen('value', staticItems[i].source, newContext),
                                staticItems[i].source.value.type,
                                staticItems[i].type,
                                newContext
                            ),
                            globalVar
                        );
                    });
                } else {
                    // Regenerate self as an assignment statement. Because this
                    // branch should only be reached for **external
                    // assignment** and **dynamic fields**
                    let externalValue = regen(staticItems[i].source.relativeName, staticItems[i].source.parentNode, context);
                    staticItems[i].backendRef.set(typeContext, externalValue);
                }
            }

            ////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////
            ///                      Computed Fields                         ///
            ////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////
            const fields = classRef.subscope.aliases;

            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];

                // If it's computed property
                if (field instanceof ScopeDynFieldItem) {
                    if (!field.backendRef) {
                        field.backendRef = new TypeContextConnector(genericParameters);
                    }

                    const fieldContext = context.clone();
                    fieldContext.typeContext = fieldContext.typeContext.merge(typeContext);

                    let value = regen(field.source.relativeName, field.source.parentNode, fieldContext);
                    field.backendRef.set(typeContext, value);
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
