import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

import ValueRef from '../ValueRef';

import * as llvm from 'llvm-node';

export default class LLVMPropertyExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.PropertyExpression;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const baseRef = node.baseRef;
        const propRef = node.propertyRef;

        const asLValue = context.getLValueContextOnce();

        let value = regen('head', node, context);
        if (propRef.backendRef) {
            if (asLValue) {
                return propRef.backendRef;
            } else {
                // Then get using backendRef
                return propRef.backendRef.generate(context);
            }
        } else {
            // Calculate index of prop in layout.
            const indexOfProp = node.baseRef.subscope.aliases.indexOf(node.propertyRef);
            const gep = context.builder.createInBoundsGEP(
                value,
                [
                    // Dereference the pointer value itself
                    llvm.ConstantInt.get(backend.context, 0),

                    // Dereference the field
                    llvm.ConstantInt.get(backend.context, indexOfProp)
                ]
            );

            if (asLValue) {
                return new ValueRef(gep, { isPtr: true });
            } else {
                return context.builder.createLoad(gep);
            }
        }
    }
}
