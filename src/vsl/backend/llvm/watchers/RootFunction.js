import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
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

        // This specifies if the function should be compiled publically.
        // This means it will be visible externally. When not the case, it will
        // have a private linkage meaning the function may be optimizedo out.
        let isPublic = true;

        // Check the access modifier. This sets up the direct compilation step.
        switch (scopeItem.accessModifier) {
            case "private":
                isPublic = false;
                break;

            case "local":
            case "public":
                isPublic = true;
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

        // Lookup the return type. If there is no return ref that means it is
        // void so we do not construct.
        let returnType;
        if (scopeItem.returnType) {
            returnType = toLLVMType(scopeItem.returnType, backend.context);
        } else {
            returnType = llvm.Type.getVoidTy(backend.context);
        }

        // Get the function type by mapping each arg ref to a respective type.
        let functionType = llvm.FunctionType.get(
            returnType,
            argsRef.map(
                arg => toLLVMType(arg.type, backend.context)
            ),
            false
        );

        // Handles annotations for the function
        const shouldInline = scopeItem.shouldInline;

        // Stores the LLVM function Constant* which will be the return value of
        // this fnuction
        let func;

        // Check if a local or external func. If it has external linkage we will
        // handle it seperately
        if (node.statements instanceof t.ExternalMarker) {
            func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                getFunctionName(scopeItem),
                backend.module
            );

            // If we are inlining an external function, throw warning beacuse
            // that doesn't really make sense
            if (shouldInline) {
                backend.warn(new BackendWarning(
                    `Invalid attempt to inline an external function.`,
                    node
                ))
            }

            // We cannot have an external function _not_ be non-external because
            // that doesn't make any sense.
            if (!isPublic) {
                backend.warn(new BackendWarning(
                    `External function cannot have \`private\` access.`,
                    node
                ));
            }

            func.callingConv = llvm.CallingConv.C;
        } else {
            let isEntry = false;

            // Check if is a main call, if so do not mangle/
            if (scopeItem.rootId === "main") {
                // Ensure is a valid entry function.
                const isValidEntry = (
                    scopeItem.returnType ?
                        false :
                    scopeItem.args.length === 2 ?
                        scopeItem.args[0].type.mockType === "i32" &&
                        scopeItem.args[1].type.mockType === "pointer8" :
                    scopeItem.args.length === 1 ?
                        false :
                    scopeItem.args.length === 0
                );

                if (!isValidEntry) {
                    throw new BackendError(
                        `Entry function must be either \`func main() -> Void\`,` +
                        ` \`func main(String[]) -> Void\`, or` +
                        ` \`func main(Int, Pointer<ByteSequence>) -> Void\`.`,
                        node
                    );
                }

                isEntry = true;
                functionType = llvm.FunctionType.get(
                    llvm.Type.getInt32Ty(backend.context),
                    [
                        llvm.Type.getInt32Ty(backend.context),
                        llvm.Type.getInt8Ty(backend.context).getPointerTo().getPointerTo()
                    ],
                    false
                );

                if (shouldInline) {
                    backend.warn(new BackendWarning(
                        `Cannot inline the entry function.`,
                        node
                    ));
                }
            }

            // Specifies different linkage for private v public
            let linkage = isPublic ?
                llvm.LinkageTypes.ExternalLinkage:
                llvm.LinkageTypes.InternalLinkage;

            // Create this function's prototype
            func = llvm.Function.create(
                functionType,
                linkage,
                getFunctionName(scopeItem),
                backend.module
            );

            // Add the appropriate attribute if a @inline tag exists
            if (shouldInline && !isEntry) {
                func.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);

                // TODO: if exceptions are supported, remove this
                func.addFnAttr(llvm.Attribute.AttrKind.NoUnwind);
            }

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

            // Add exit block for void functions.
            if (!scopeItem.returnType) {
                builder.createRetVoid();
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
