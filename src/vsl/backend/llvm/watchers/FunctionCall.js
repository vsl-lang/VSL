import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';
import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionInstance from '../helpers/getFunctionInstance';
import tryGenerateCast from '../helpers/tryGenerateCast';
import { getVTableOffset } from '../helpers/layoutType';
import { getMethodOffsetInVTable } from '../helpers/VTable';

export default class LLVMFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Get the env type context
        const parentTypeContext = context.typeContext;

        // Get type context of the function call
        const typeContext = node.typeContext.propogateContext(parentTypeContext);

        // Get list of possible overloads
        // at this point there should only beo ne
        const functionRef = node.reference;

        // Get args which should use default param
        const argPositionsTreatedOptional = node.argPositionsTreatedOptional;

        if (functionRef === null) {
            throw new BackendError(
                `Function call is ambiguous. Multiple possible references.`,
                node.head
            );
        }


        // See if takes self
        const takesSelfParameter = isInstanceCtx(functionRef)

        // Create context to generate function call with
        const ctx = context.bare();
        ctx.typeContext = typeContext;

        const vtableClass = functionRef.virtualParentMethod.owner.owner;
        const useVtable = !functionRef.implementationIsDefinite && vtableClass.dynamicDispatch;

        // Create argument instruction list
        let compiledArgs = [];

        let callee;
        if (!useVtable) {
            callee = getFunctionInstance(functionRef, ctx, regen);

            // Compile self if it accepts one.
            if (takesSelfParameter) {
                // Get the value
                if (!(node.head instanceof t.PropertyExpression)) {
                    throw new BackendError(
                        `Expected property with instance method.`
                    );
                }

                const headValue = regen('head', node.head, context);

                if (!useVtable) {
                    compiledArgs.push(headValue);
                }
            }
        } else {
            if (!(node.head instanceof t.PropertyExpression)) {
                throw new BackendError(
                    `Expected property for dynamic call.`
                );
            }

            const headValue = regen('head', node.head, context);
            compiledArgs.push(headValue);

            // If vtable we'll cast to the vtable class.
            // Get the self param
            const selfParameter = tryGenerateCast(
                headValue,
                node.head.baseRef,
                vtableClass,
                context
            );

            const vtable = getVTableOffset(selfParameter, vtableClass, context);
            callee = context.builder.createLoad(
                getMethodOffsetInVTable(
                    vtable,
                    vtableClass,
                    functionRef,
                    context
                )
            );
        }


        // Compile arguments
        for (let i = 0, k = 0; i < functionRef.args.length; i++, k++) {
            let value;
            if (argPositionsTreatedOptional.includes(i)) {
                const optionalContext = context.clone();
                const defaultExprArg = functionRef.args[i].node.defaultValue;
                optionalContext.selfReference = takesSelfParameter ? compiledArgs[0] : null;
                value = regen(defaultExprArg.relativeName, defaultExprArg.parentNode, context);
                k--;
            } else {
                value = tryGenerateCast(
                    regen('value', node.arguments[k], context),
                    node.argumentReferences[k],
                    functionRef.args[i].type.contextualType(typeContext),
                    context
                );
            }
            compiledArgs.push(value);
        }

        let result = context.builder.createCall(
            callee,
            compiledArgs
        );
        return result;
    }
}
