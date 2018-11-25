import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';

import createShortCircut from '../helpers/createShortCircut';

import * as llvm from "llvm-node";

export default class LLVMTernaryExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.Ternary;
    }

    receive(node, tool, regen, context) {
        return context.builder.createSelect(
            regen('condition', node, context),
            regen('ifTrue', node, context),
            regen('ifFalse', node, context)
        );
    }
}
