import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import toLLVMType from '../helpers/toLLVMType';

import * as llvm from "llvm-node";

export default class LLVMNativeBlock extends BackendWatcher {
    match(type) {
        return type instanceof t.NativeBlock;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const name = node.value;
        const func = node.parentNode;

        switch (name) {
            case "iadd": return context.builder.createRet(
                context.builder.createAdd(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "isub": return context.builder.createRet(
                context.builder.createSub(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "imul": return context.builder.createRet(
                context.builder.createMul(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "idiv": return context.builder.createRet(
                context.builder.createFDiv(
                    context.builder.createSIToFP(
                        func.args[0].aliasRef.backendRef.generate(),
                        llvm.Type.getDoubleTy(backend.context)
                    ),
                    context.builder.createSIToFP(
                        func.args[1].aliasRef.backendRef.generate(),
                        llvm.Type.getDoubleTy(backend.context)
                    )
                )
            );

            case "uidiv": return context.builder.createRet(
                context.builder.createFDiv(
                    context.builder.createUIToFP(
                        func.args[0].aliasRef.backendRef.generate(),
                        llvm.Type.getDoubleTy(backend.context)
                    ),
                    context.builder.createUIToFP(
                        func.args[1].aliasRef.backendRef.generate(),
                        llvm.Type.getDoubleTy(backend.context)
                    )
                )
            );

            case "sdiv": return context.builder.createRet(
                context.builder.createSDiv(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "udiv": return context.builder.createRet(
                context.builder.createSDiv(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "irem": return context.builder.createRet(
                context.builder.createSRem(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uirem": return context.builder.createRet(
                context.builder.createURem(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ieq": return context.builder.createRet(
                context.builder.createICmpEQ(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ineq": return context.builder.createRet(
                context.builder.createICmpNE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ige": return context.builder.createRet(
                context.builder.createICmpSGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uige": return context.builder.createRet(
                context.builder.createICmpUGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ile": return context.builder.createRet(
                context.builder.createICmpSLE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uile": return context.builder.createRet(
                context.builder.createICmpULE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "igt": return context.builder.createRet(
                context.builder.createICmpSGT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uigt": return context.builder.createRet(
                context.builder.createICmpUGT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ilt": return context.builder.createRet(
                context.builder.createICmpSLT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ult": return context.builder.createRet(
                context.builder.createICmpULT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            default: throw new BackendError(
                `Unsupported native operation ${name}`,
                node
            );
        }
    }
}
