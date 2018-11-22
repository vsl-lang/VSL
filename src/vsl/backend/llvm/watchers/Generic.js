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

        // If we're at this point then we are ACCESSING a STATIC FIELD on a GENERIC CLASS.
        // In that case we can just return the normal class because generic props don't matter.
        return regen('head', node, context);
    }
}
