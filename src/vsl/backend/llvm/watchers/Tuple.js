import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import toLLVMType from '../helpers/toLLVMType';
import { getFieldOffset } from '../helpers/TupleHelpers';

import * as llvm from 'llvm-node';

export default class LLVMTuple extends BackendWatcher {
    match(type) {
        return type instanceof t.Tuple;
    }

    receive(node, tool, regen, context) {
        if (!node.reference) {
            throw new BackendError(
                `Tuple has ambiguous type`,
                node
            );
        }

        const tupleType = node.reference;
        const type = toLLVMType(tupleType, context);

        const tupleStruct = context.builder.createAlloca(type.elementType);
        for (let i = 0; i < node.expressions.length; i++) {
            const result = regen('value', node.expressions[i], context);
            const field = tupleType.parameters[i].reference;

            context.builder.createStore(
                result,
                context.builder.createInBoundsGEP(
                    tupleStruct,
                    [
                        llvm.ConstantInt.get(context.ctx, 0),
                        llvm.ConstantInt.get(context.ctx, getFieldOffset(field, tupleType))
                    ]
                )
            );
        }

        return tupleStruct;
    }
}
