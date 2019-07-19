import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import toLLVMType from '../helpers/toLLVMType';

import getFunctionInstance from '../helpers/getFunctionInstance';

import * as llvm from "llvm-node";

export default class LLVMBinaryExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.BinaryExpression;
    }

    receive(node, tool, regen, context) {
        // If we don't have a ref,
        if (node.reference === null) {
            throw new BackendError(
                `Ambiguous use of Binary Expression`,
                node
            );
        }

        const lhs = regen('lhs', node, context);
        const rhs = regen('rhs', node, context);

        const opCtx = context.bare();
        const opFunction = node.reference;

        if (opFunction.isDeprecated) {
            context.backend.warn(new BackendWarning(
                opFunction.deprecationStatus,
                node
            ));
        }

        const binaryFunction = getFunctionInstance(opFunction, opCtx, regen);

        const result = context.builder.createCall(
            binaryFunction,
            [
                lhs,
                rhs
            ]
        );

        return result;
    }
}
