import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import toLLVMType from '../helpers/toLLVMType';

import * as llvm from "llvm-node";

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
                arg => toLLVMType(arg, backend.context)
            ),
            false
        );

        // Check if a local or external func
        if (node.statements instanceof t.ExternalMarker) {
            let func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                node.statements.rootId,
                backend.module
            );
        } else {
            // Create this function's prototype
            let func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                scopeItem.unqiueName,
                backend.module
            );

            let statements = node.statements.statements;
            for (let i = 0; i < statements.length; i++) {
                regen(i, statements, context);
            }
        }
    }
}
