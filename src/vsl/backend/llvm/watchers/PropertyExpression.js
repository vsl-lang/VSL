import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { getTypeOffset } from '../helpers/layoutType';
import { Key } from '../LLVMContext';
import ValueRef from '../ValueRef';
import LValueRef from '../LValueRef';

import ScopeDynFieldItem from '../../../scope/items/scopeDynFieldItem';
import ScopeAliasItem from '../../../scope/items/scopeAliasItem';

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
        const typeContext = baseRef.getTypeContext().propogateContext(context.typeContext);

        const value = regen('head', node, context);

        // If 'propRef' isn't an alias then something is wrong
        if (!(propRef instanceof ScopeAliasItem)) {
            this.emit(
                `Expected access in tail of property access expression to ` +
                `evaluate to a field or property.`,
                node.tail
            )
        }

        // We might be accessing a static or dynamic field. For this purpose we
        // will want to 'regen' the type that the LHS is.
        // MyClass.foo => generate 'class MyClass'
        // myClass.foo => generate 'class MyClass'
        const headTypeSource = propRef.owner.owner.source;
        regen(headTypeSource.relativeName, headTypeSource.parentNode, context.bare());

        const customBehavior = propRef.backendRef?.get(typeContext);

        console.log(String(node));
        console.log(propRef.backendRef?.toString());
        console.log(context.typeContext.toString());
        console.log(typeContext.toString());

        // If RHS has special behavior then we'll use that. This includes things
        // like computed properties
        if (customBehavior) {
            if (asLValue) {
                return new LValueRef({ self: value, property: customBehavior });
            } else {
                // Then get using backendRef
                return customBehavior.generate(context, value);
            }
        } else {
            if (propRef instanceof ScopeDynFieldItem) {
                throw new BackendError(
                    `Tail of property is dynamic field but it was never compiled.`,
                    node.tail
                );
            }

            if (!value) {
                throw new BackendError(
                    `Tail of property expression did not compile to a value.`,
                    node.tail
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
                return new LValueRef({
                    self: value,
                    property: new ValueRef(propPtr, { isPtr: true })
                });
            } else {
                return context.builder.createLoad(propPtr);
            }
        }
    }
}
