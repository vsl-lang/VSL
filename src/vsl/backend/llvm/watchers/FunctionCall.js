import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';
import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionInstance from '../helpers/getFunctionInstance';

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

        if (functionRef === null) {
            throw new BackendError(
                `Function call is ambiguous. Multiple possible references.`,
                node.head
            );
        }


        // Create context to generate function call with
        const ctx = context.bare();
        ctx.typeContext = typeContext;
        const callee = getFunctionInstance(functionRef, ctx, regen);


        // Create argument instruction list
        let compiledArgs = [];
        for (let i = 0; i < node.arguments.length; i++) {
            let value = regen('value', node.arguments[i], context);
            compiledArgs.push(value);
        }

        // If this is an instance we'll pass in self. We'll get this from the
        // LHS CallRef
        if (isInstanceCtx(functionRef)) {
            // Get the value
            if (!(node.head instanceof t.PropertyExpression)) {
                throw new BackendError(
                    `Expected property with instance method.`
                );
            }

            const headValue = regen('head', node.head, context);
            compiledArgs.unshift(headValue);
        }

        let result = context.builder.createCall(
            callee,
            compiledArgs
        );
        return result;
    }
}
