import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import toLLVMType from '../helpers/toLLVMType';

import getFunctionInstance from '../helpers/getFunctionInstance';

import * as llvm from "llvm-node";

export default class LLVMUnaryExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.UnaryExpression;
    }

    receive(node, tool, regen, context) {
        // If we don't have a ref,
        if (node.reference === null) {
            throw new BackendError(
                `Ambiguous use of Unary Expression`,
                node
            );
        }

        const expression = regen('expression', node, context);

        return context.builder.createCall(
            getFunctionInstance(node.reference, context.bare(), regen),
            [
                expression
            ]
        );
    }
}
