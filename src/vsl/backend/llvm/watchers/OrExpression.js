import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';

import createShortCircut from '../helpers/createShortCircut';

import * as llvm from "llvm-node";

export default class LLVMAndExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.OrExpression;
    }

    receive(node, tool, regen, context) {
        return createShortCircut(
            regen('lhs', node, context),
            (ctx) => regen('rhs', node, ctx),
            context
        );
    }
}
