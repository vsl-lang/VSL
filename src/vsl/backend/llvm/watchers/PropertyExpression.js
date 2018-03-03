import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

import * as llvm from 'llvm-node';

export default class LLVMPropertyExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.PropertyExpression;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        const baseRef = node.baseRef;
        const propRef = node.propertyRef;

        let value = regen('head', node, context);

        // Calculate index of prop in layout.
        let indexOfProp = node.baseRef.subscope.aliases.indexOf(node.propertyRef);

        return context.builder.createLoad(
            context.builder.createInBoundsGEP(
                value,
                [
                    // Dereference the pointer value itself
                    llvm.ConstantInt.get(backend.context, 0),

                    // Dereference the field
                    llvm.ConstantInt.get(backend.context, indexOfProp)
                ]
            )
        );
    }
}
