import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';

import t from '../../../parser/nodes';

/**
 * Generic
 */
export default class LLVMGeneric extends BackendWatcher {
    match(type) {
        return type instanceof t.Generic;
    }

    receive(node, tool, regen, context) {
        // const ctx = context.bare();
        // ctx.typeContext = node.reference;
        // TODO: finish
        // const context = node.reference.getTypeContext();
    }
}
