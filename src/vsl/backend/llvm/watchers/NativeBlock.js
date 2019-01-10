import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import toLLVMType from '../helpers/toLLVMType';

import { alloc, free } from '../helpers/MemoryManager';
import structInPointerContext from '../helpers/structInPointerContext';

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

            case "fadd": return context.builder.createRet(
                context.builder.createFAdd(
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

            case "fsub": return context.builder.createRet(
                context.builder.createFSub(
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

            case "fmul": return context.builder.createRet(
                context.builder.createFMul(
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
                context.builder.createUDiv(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "fdiv": return context.builder.createRet(
                context.builder.createFDiv(
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

            case "frem": return context.builder.createRet(
                context.builder.createFRem(
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

            case "feq": return context.builder.createRet(
                context.builder.createFCmpOEQ(
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

            case "fneq": return context.builder.createRet(
                context.builder.createFCmpONE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "igte": return context.builder.createRet(
                context.builder.createICmpSGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uigte": return context.builder.createRet(
                context.builder.createICmpUGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uigte": return context.builder.createRet(
                context.builder.createFCmpUGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "ilte": return context.builder.createRet(
                context.builder.createICmpSLE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "uilte": return context.builder.createRet(
                context.builder.createICmpULE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "flte": return context.builder.createRet(
                context.builder.createFCmpOLE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "fgte": return context.builder.createRet(
                context.builder.createFCmpOGE(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "isnan": return context.builder.createRet(
                context.builder.createFCmpUNO(
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

            case "fgt": return context.builder.createRet(
                context.builder.createFCmpOGT(
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

            case "uilt": return context.builder.createRet(
                context.builder.createICmpULT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "flt": return context.builder.createRet(
                context.builder.createFCmpOLT(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "inot": return context.builder.createRet(
                context.builder.createNot(
                    func.args[0].aliasRef.backendRef.generate()
                )
            );

            case "ineg": return context.builder.createRet(
                context.builder.createNeg(
                    func.args[0].aliasRef.backendRef.generate()
                )
            );

            case "fneg": return context.builder.createRet(
                context.builder.createFNeg(
                    func.args[0].aliasRef.backendRef.generate()
                )
            );

            case "ashr": return context.builder.createRet(
                context.builder.createAShr(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "lshr": return context.builder.createRet(
                context.builder.createLShr(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "shl": return context.builder.createRet(
                context.builder.createShl(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "and": return context.builder.createRet(
                context.builder.createAnd(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "or": return context.builder.createRet(
                context.builder.createOr(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "xor": return context.builder.createRet(
                context.builder.createXor(
                    func.args[0].aliasRef.backendRef.generate(),
                    func.args[1].aliasRef.backendRef.generate()
                )
            );

            case "load": return context.builder.createRet(
                context.builder.createLoad(
                    context.parentFunc.getArguments()[0]
                )
            );

            case "store": context.builder.createStore(
                    context.parentFunc.getArguments()[1],
                    context.parentFunc.getArguments()[0]
            );
            return context.builder.createRetVoid();

            case "offset": return context.builder.createRet(
                context.builder.createInBoundsGEP(
                    context.parentFunc.getArguments()[0],
                    [context.parentFunc.getArguments()[1]]
                )
            );

            case "sizeof": {
                const genericType = [...context.typeContext.genericParameters][0][1];
                let genericTy = toLLVMType(genericType, context);

                if (structInPointerContext(genericType)) {
                    genericTy = genericTy.elementType;
                }

                const size = backend.module.dataLayout.getTypeAllocSize(genericTy);

                return context.builder.createRet(
                    llvm.ConstantInt.get(
                        context.ctx,
                        size,
                        64,
                        false
                    )
                );
            }

            case "log32": return context.builder.createCall(
                backend.module.getOrInsertFunction(
                    'llvm.log.f32',
                    llvm.FunctionType.get(
                        llvm.Type.getFloatTy(backend.context),
                        [llvm.Type.getFloatTy(backend.context)],
                        false
                    )
                ),
                [
                    context.parentFunc.getArguments()[0]
                ]
            );

            case "log64": return context.builder.createCall(
                backend.module.getOrInsertFunction(
                    'llvm.log.f64',
                    llvm.FunctionType.get(
                        llvm.Type.getDoubleTy(backend.context),
                        [llvm.Type.getDoubleTy(backend.context)],
                        false
                    )
                ),
                [
                    context.parentFunc.getArguments()[0]
                ]
            );

            default: throw new BackendError(
                `Unsupported native operation ${name}`,
                node
            );
        }
    }
}
