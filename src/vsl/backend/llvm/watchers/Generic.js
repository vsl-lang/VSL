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

        const asLValue = context.popValue(Key.LValueContext);

        if (node.reference === null) {
            throw new BackendError(
                `Item ${node.value} has ambigious reference in this context.`,
                node
            );
        } else {
            // If ScopeTypeItem then we have metaclass
            if (node.reference instanceof ScopeTypeItem) {
                // This means we have a static class. We will return the
                // @static.Goat { field1, field2, field3 } obj which is globally
                // init'd.
                const source = node.reference.source;
                const newCtx = context.bare();
                return regen(source.relativeName, source.parentNode, newCtx);
            } else {
                // Otherwise we're referring to variable
                if (asLValue) {
                    return node.reference.backendRef;
                } else {
                    return node.reference.backendRef.generate(context);
                }
            }
        }
    }
}
