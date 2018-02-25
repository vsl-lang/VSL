import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';
import VSLTokenType from '../../../parser/vsltokentype';

import * as llvm from 'llvm-node';

const DEFAULT_INT_SIZE = 32;

export default class LLVMLiteral extends BackendWatcher {
    match(type) {
        return type instanceof t.Literal;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        switch (node.type) {
            case VSLTokenType.Integer:
                let value = parseInt(node.literal, 10);
                return llvm.ConstantInt.get(backend.context, value, DEFAULT_INT_SIZE, true);

            case VSLTokenType.ByteSequence:
                return context.builder.createGlobalStringPtr(node.literal);

            default: throw new BackendError(
                `Unknown literal with type id ${node.type}`,
                node
            )
        }
    }
}
