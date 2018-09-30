import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMGeneric extends BackendWatcher {
    match(type) {
        return type instanceof t.Generic;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        throw new BackendError(
            `Generics not supported :(.`,
            node
        );
    }
}
