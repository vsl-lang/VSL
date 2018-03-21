import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';

import * as llvm from 'llvm-node';

export default class LLVMSelf extends BackendWatcher {
    match(type) {
        return type instanceof t.Self;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Always refers to first argument.
        const [ self ] = context.parentFunc.getArguments();
        return self;
    }
}
