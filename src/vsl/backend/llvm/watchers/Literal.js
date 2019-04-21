import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';
import VSLTokenType from '../../../parser/vsltokentype';
import InitPriority from '../InitPriority';
import { getPcreType } from '../helpers/pcreHelpers';
import getOrInsertFunction from '../helpers/getOrInsertFunction';
import toLLVMType from '../helpers/toLLVMType';

import * as llvm from 'llvm-node';

const VSL_STRING_OPT_NONE = 0x00;
const VSL_STRING_OPT_NO_DEALLOC = 1 << 0;

export default class LLVMLiteral extends BackendWatcher {
    match(type) {
        return type instanceof t.Literal;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const type = node.reference;

        if (type === null) {
            throw new BackendError(
                `Ambiguous types for this literal.`,
                node
            );
        }

        switch (node.type) {
            case VSLTokenType.Integer:
                let value = parseInt(node.literal, 10);

                // Gets integer description value from type mock.
                let desc = this.getIntDesc(type);

                return llvm.ConstantInt.get(
                    backend.context,
                    value,
                    desc.size,
                    desc.signed
                );

            case VSLTokenType.Decimal:
                return llvm.ConstantExpr.getFPCast(
                    llvm.ConstantFP.get(
                        context.ctx,
                        +node.literal
                    ),
                    toLLVMType(type, context)
                );

            case VSLTokenType.String:
                let targetTy = toLLVMType(type, context).elementType;
                let globalVar = new llvm.GlobalVariable(
                    backend.module,
                    targetTy,
                    true,
                    llvm.LinkageTypes.PrivateLinkage,
                    llvm.ConstantStruct.get(
                        targetTy,
                        [
                            llvm.ConstantInt.get(
                                backend.context,
                                VSL_STRING_OPT_NO_DEALLOC,
                                8,
                                false
                            ),
                            llvm.ConstantInt.get(
                                backend.context,
                                node.literal.length,
                                32,
                                false
                            ),
                            context.builder.createGlobalStringPtr(
                                node.literal
                            )
                        ]
                    )
                );

                globalVar.setUnnamedAddr(llvm.UnnamedAddr.Global);

                return globalVar;

            case VSLTokenType.Boolean:
                return node.literal ?
                    llvm.ConstantInt.getTrue(backend.context) :
                    llvm.ConstantInt.getFalse(backend.context)

            case VSLTokenType.ByteSequence:
                return context.builder.createGlobalStringPtr(node.literal);

            case VSLTokenType.Regex:
                const [, regex, flags = ""] = node.literal.split('/');

                context.backend.regularExpressionLibrary = 'pcre'; // Specify PCRE as regex library

                const pcreTy = getPcreType(context).getPointerTo();

                // Get the pcre_compile function
                const pcre_compile = getOrInsertFunction(
                    context,
                    'pcre_compile',
                    llvm.FunctionType.get(
                        pcreTy,
                        [
                            llvm.Type.getInt8PtrTy(context.ctx), // pattern
                            llvm.Type.getInt32Ty(context.ctx), // options
                            llvm.Type.getInt8PtrTy(context.ctx).getPointerTo(), // error ptr
                            llvm.Type.getInt32Ty(context.ctx).getPointerTo(), // error offset
                            llvm.Type.getInt8PtrTy(context.ctx) // table pointer
                        ],
                        false
                    ),
                    llvm.LinkageTypes.ExternalLinkage
                );

                // Create the global function
                const regexInstance = new llvm.GlobalVariable(
                    backend.module,
                    pcreTy,
                    false,
                    llvm.LinkageTypes.PrivateLinkage,
                    llvm.ConstantPointerNull.get(pcreTy)
                );

                backend.addInitTask(InitPriority.REGEX, (context) => {
                    context.builder.createStore(
                        context.builder.createCall(
                            pcre_compile,
                            [
                                context.builder.createGlobalStringPtr(regex),
                                llvm.ConstantInt.get(context.ctx, 0, 32),
                                llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(context.ctx, 0).getPointerTo()),
                                llvm.ConstantPointerNull.get(llvm.Type.getInt32Ty(context.ctx).getPointerTo()),
                                llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(context.ctx))
                            ]
                        ),
                        regexInstance
                    )
                });

                return regexInstance;

            default: throw new BackendError(
                `Unknown literal with type id ${node.type}`,
                node
            )
        }
    }

    getIntDesc(type) {
        switch (type.mockType) {
            case "i8": return { size: 8, signed: true }
            case "ui8": return { size: 8, signed: false }

            case "i16": return { size: 16, signed: true }
            case "ui16": return { size: 16, signed: false }

            case "i32": return { size: 32, signed: true }
            case "ui32": return { size: 32, signed: false }

            case "i64": return { size: 64, signed: true }
            case "ui64": return { size: 64, signed: false }

            default: throw new BackendError(
                `The type ${type} has an invalid type mock for the ` +
                `provided primitive.`,
                type.source
            )
        }
    }
}
