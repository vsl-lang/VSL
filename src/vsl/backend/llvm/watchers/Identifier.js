import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMIdentifier extends BackendWatcher {
    match(type) {
        return type instanceof t.Identifier;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        if (node.reference === null) {
            throw new BackendError(
                `Item ${node.value} has ambigious reference in this context.`,
                node
            );
        } else {
            return node.reference.backendRef;
        }
    }
}
