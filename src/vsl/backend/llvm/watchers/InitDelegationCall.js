import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMInitDelegationCall extends BackendWatcher {
    match(type) {
        return type instanceof t.InitDelegationCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;


    }
}
