import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { getTypeOffset } from '../helpers/layoutType';
import { Key } from '../LLVMContext';
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

        const asLValue = context.popValue(Key.LValueContext);

        const value = regen('head', node, context);

        // If RHS has special behavior then we'll use that. This includes things
        // like computed properties
        if (propRef.backendRef) {
            if (asLValue) {
                return propRef.backendRef;
            } else {
                // Then get using backendRef
                return propRef.backendRef.generate(context);
            }
        } else {
            if (!value) {
                throw new BackendError(
                    `Head of property expression did not compile to a value.`,
                    node.head
                );
            }

            // get prop ptr
            const propPtr = getTypeOffset(
                value,
                baseRef.contextualType(context.typeContext),
                node.propertyRef,
                context
            );

            if (asLValue) {
                return new ValueRef(propPtr, { isPtr: true });
            } else {
                return context.builder.createLoad(propPtr);
            }
        }
    }
}
