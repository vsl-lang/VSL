import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import toLLVMType from '../helpers/toLLVMType';

import getFunctionName from '../helpers/getFunctionName';

import * as llvm from "llvm-node";

// Size of return in int(main)
const MAIN_RETURN_SIZE = 32;

export default class LLVMRootFunctionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const scopeItem = node.scopeRef;

        const returnRef = scopeItem.returnType;
        const argsRef = scopeItem.args;

        let shouldDirectlyCompile = false;

        // Check the access modifier
        switch (scopeItem.accessModifier) {
            case "local":
            case "private":
                shouldDirectlyCompile = false;
                break;

            case "public":
                shouldDirectlyCompile = true;
                break;

            case "protected":
            default:
                backend.warn(new BackendWarning(
                    `The access modifier for this function was ${scopeItem.accessModifier}. ` +
                    `If a top-level function has an access modifier it must be \`public\`,  ` +
                    `or \`private\`.`,
                    node
                ));
        }

        let returnType;
        if (scopeItem.returnType) {
            returnType = toLLVMType(scopeItem.returnType, backend.context);
        } else {
            returnType = llvm.Type.getVoidTy(backend.context);
        }

        let functionType = llvm.FunctionType.get(
            returnType,
            argsRef.map(
                arg => toLLVMType(arg.type, backend.context)
            ),
            false
        );

        let func;

        // Check if a local or external func
        if (node.statements instanceof t.ExternalMarker) {
            func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                getFunctionName(scopeItem),
                backend.module
            );

            func.callingConv = llvm.CallingConv.C;
        } else {
            let isEntry = false;

            // Check if is a main call, if so do not mangle/
            if (scopeItem.rootId === "main") {
                isEntry = true;
                functionType = llvm.FunctionType.get(
                    llvm.Type.getInt32Ty(backend.context),
                    [
                        llvm.Type.getInt32Ty(backend.context),
                        llvm.Type.getInt8Ty(backend.context).getPointerTo().getPointerTo()
                    ],
                    false
                )
            }

            // Create this function's prototype
            func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                getFunctionName(scopeItem),
                backend.module
            );

            // Now create the function body
            let entryBlock = llvm.BasicBlock.create(
                backend.context,
                "entry",
                func
            );

            let builder = new llvm.IRBuilder(entryBlock);
            let newContext = context.clone();
            newContext.builder = builder;

            let statements = node.statements.statements;
            for (let i = 0; i < statements.length; i++) {
                regen(i, statements, newContext);
            }

            // Add `ret 0` for entry case
            if (isEntry) {
                builder.createRet(
                    llvm.ConstantInt.get(
                        backend.context,
                        0,
                        MAIN_RETURN_SIZE
                    )
                );
            }
        }

        return func;
    }
}
