import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ScopeInitItem from '../../../scope/items/scopeInitItem';
import getFunctionName from '../helpers/getFunctionName';
import toLLVMType from '../helpers/toLLVMType';
import { getTypeOffset } from '../helpers/layoutType';

import { alloc } from '../helpers/MemoryManager'
import * as llvm from 'llvm-node';

export default class LLVMInitializerCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall && type.headRef instanceof ScopeInitItem;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const initRef = node.headRef;

        if (initRef === null) {
            throw new BackendError(
                `Initializer call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        const classRef = initRef.initializingType;
        const classType = toLLVMType(classRef, backend);

        const sizeOfClass = backend.module.dataLayout.getTypeStoreSize(classType.elementType);

        // Get the name of this function so we can ref it
        const calleeName = getFunctionName(initRef);

        // Then, with the callee
        let callee = backend.module.getFunction(calleeName);

        // Check if callee is generated yet. If not we'll generate it.
        if (!callee) {
            if (initRef.isDefaultInit) {
                // NoRecurse InlineHint
                callee = llvm.Function.create(
                    llvm.FunctionType.get(
                        classType,
                        [classType],
                        false
                    ),
                    llvm.LinkageTypes.ExternalLinkage,
                    calleeName,
                    backend.module
                );

                callee.addFnAttr(llvm.Attribute.AttrKind.InlineHint);
                callee.addFnAttr(llvm.Attribute.AttrKind.NoRecurse);

                let defaultInitBlock = llvm.BasicBlock.create(
                    backend.context,
                    'entry',
                    callee
                );

                // Builder for default init
                let defaultBuilder = new llvm.IRBuilder(defaultInitBlock);

                const self = callee.getArguments()[0];

                const defaultCtx = context.bare();
                defaultCtx.builder = defaultBuilder;
                defaultCtx.parentFunc = initRef;

                // Run default init for all fields with default value
                for (let i = 0; i < classRef.subscope.aliases.length; i++) {
                    const defaultField = classRef.subscope.aliases[i];
                    const fieldNode = defaultField.source;
                    if (fieldNode?.value) {
                        let fieldValue = regen('value', fieldNode, defaultCtx);
                        let indexOfField = getTypeOffset(classRef, defaultField);

                        let storeInst = defaultBuilder.createStore(
                            fieldValue,
                            defaultBuilder.createInBoundsGEP(
                                self,
                                [
                                    // Deref the field itself
                                    llvm.ConstantInt.get(backend.context, 0),

                                    // The field we want
                                    llvm.ConstantInt.get(backend.context, indexOfField)
                                ]
                            )
                        );
                    }
                }

                // Return node itself
                defaultBuilder.createRet(self);
            } else {
                let calleeNode = initRef.source,
                    parent = calleeNode.parentNode,
                    name = calleeNode.relativeName;

                // Anon. IR builder
                let calleeContext = context.bare();
                callee = regen(name, parent, calleeContext);
            }

        }

        // Allocate space for struct
        // malloc() returns a void* (i8*) so lets also convert that to the
        //  pointer of correct type.
        const allocCall = alloc(sizeOfClass, context);
        const instance = context.builder.createBitCast(
            allocCall,
            classType
        );

        // Create argument instruction list
        let compiledArgs = [instance];
        for (let i = 0; i < node.arguments.length; i++) {
            let value = regen('value', node.arguments[i], context);
            compiledArgs.push(value);
        }

        return context.builder.createCall(
            callee,
            compiledArgs
        );
    }
}
