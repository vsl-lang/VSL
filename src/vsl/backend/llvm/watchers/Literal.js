import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';
import VSLTokenType from '../../../parser/vsltokentype';

import toLLVMType from '../helpers/toLLVMType';
import stringType from '../helpers/stringType'

import * as llvm from 'llvm-node';

export default class LLVMLiteral extends BackendWatcher {
    match(type) {
        return type instanceof t.Literal;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;
        const type = node.typeRef;

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

            case VSLTokenType.String:
                let stringTy = stringType(backend.module, backend.context);
                let targetTy = toLLVMType(type, backend);

                let globalVar = new llvm.GlobalVariable(
                    backend.module,
                    targetTy,
                    true,
                    llvm.LinkageTypes.PrivateLinkage,
                    llvm.ConstantExpr.getBitCast(
                        llvm.ConstantStruct.get(
                            stringTy,
                            [
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
                        ),
                        targetTy
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
