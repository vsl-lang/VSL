import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import toLLVMType from '../helpers/toLLVMType';
import ValueRef from '../ValueRef';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';

import { Key } from '../LLVMContext';
import { isValidEntryName, isValidEntryTy } from '../helpers/EntryPoint';
import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionName from '../helpers/getFunctionName';
import TypeContext from '../../../scope/TypeContext';

import * as llvm from "llvm-node";

// Size of return in int(main)
const MAIN_RETURN_SIZE = 32;

export default class LLVMFunctionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const scopeItem = node.reference;

        const nodeArgs = node.args;

        const returnRef = scopeItem.returnType;
        const argsRef = scopeItem.args;

        const typeContext = context.typeContext;

        const llvmFuncName = getFunctionName(scopeItem, typeContext);

        // Check if this has already been generated
        // We'll store a Map with the type context.
        if (scopeItem.isGeneric) {
            const callee = scopeItem.backendRef.get(typeContext);
            if (callee) return callee;
        } else {
            const callee = scopeItem.backendRef.get(TypeContext.empty());
            if (callee) return callee;
        }

        // This specifies if the function should be compiled publically.
        // This means it will be visible externally. When not the case, it will
        // have a private linkage meaning the function may be optimizedo out.
        let isPublic;

        // Check the access modifier. This sets up the direct compilation step.
        switch (scopeItem.accessModifier) {
            case "private":
            case "public":
            case "local":
                isPublic = false;
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
            returnType = toLLVMType(scopeItem.returnType.selfType.contextualType(typeContext), backend);
        } else {
            returnType = llvm.Type.getVoidTy(backend.context);
        }

        const argTypes = argsRef.map(
            arg => toLLVMType(arg.type.selfType.contextualType(typeContext), backend)
        );

        // Where the physical args start
        let argAccessOffset = 0;

        // If this _is_ a method (i.e. instance function), we'll want to make
        //  sure we add `self` as the first argument. Also should not be static
        if (isInstanceCtx(scopeItem)) {
            argAccessOffset += 1;
            const selfType = toLLVMType(scopeItem.owner.owner.selfType.contextualType(typeContext), backend);
            argTypes.unshift(
                selfType
            );
        }

        // Get the function type by mapping each arg ref to a respective type.
        let functionType = llvm.FunctionType.get(
            returnType,
            argTypes,
            false
        );

        // Handles annotations for the function
        const shouldInline = scopeItem.shouldInline;
        const shouldForceInline = scopeItem.shouldForceInline;

        // Stores the LLVM function Constant* which will be the return value of
        // this fnuction
        let func;

        // Check if a local or external func. If it has external linkage we will
        // handle it seperately
        if (node.statements instanceof t.ExternalMarker) {
            func = llvm.Function.create(
                functionType,
                llvm.LinkageTypes.ExternalLinkage,
                llvmFuncName,
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

            func.callingConv = llvm.CallingConv.C;
        } else {
            let isEntry = false;

            // Check if is a main call, if so do not mangle/
            if (isValidEntryName(scopeItem.rootId)) {
                // Ensure is a valid entry function.
                const isValidEntry = isValidEntryTy(scopeItem);

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
            let linkage = isPublic || isEntry ?
                llvm.LinkageTypes.ExternalLinkage:
                llvm.LinkageTypes.InternalLinkage;

            // Create this function's prototype
            func = llvm.Function.create(
                functionType,
                linkage,
                llvmFuncName,
                backend.module
            );

            const llvmFuncArgs = func.getArguments();

            // Add the refs to each arg.
            for (let i = 0; i < nodeArgs.length; i++) {
                nodeArgs[i].aliasRef.backendRef = new ValueRef(llvmFuncArgs[argAccessOffset + i], { isPtr: false });
            }

            // Add the appropriate attribute if a @inline tag exists
            if (shouldInline && !isEntry) {
                func.addFnAttr(
                    shouldForceInline ?
                        llvm.Attribute.AttrKind.AlwaysInline :
                        llvm.Attribute.AttrKind.InlineHint);

                // TODO: if exceptions are supported, remove this
                func.addFnAttr(llvm.Attribute.AttrKind.NoUnwind);
            }

            // Now create the function body
            let entryBlock = llvm.BasicBlock.create(
                backend.context,
                "entry",
                func
            );

            context.builder = new llvm.IRBuilder(entryBlock);
            context.parentFunc = func;
            regen('statements', node, context);

            // Add exit block for void functions.
            if (!scopeItem.returnType && !isEntry) {
                context.builder.createRetVoid();
            }

            // Add `ret 0` for entry case
            if (isEntry) {
                context.builder.createRet(
                    llvm.ConstantInt.get(
                        backend.context,
                        0,
                        MAIN_RETURN_SIZE
                    )
                );
            }
        }


        scopeItem.backendRef.set(scopeItem.isGeneric ? typeContext : TypeContext.empty(), func);
        return func;
    }
}
