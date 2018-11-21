import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import isInstanceCtx from '../helpers/isInstanceCtx';
import getFunctionInstance from '../helpers/getFunctionInstance';

export default class LLVMFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Get list of possible overloads
        // at this point there should only beo ne
        const functionRef = node.reference;

        if (functionRef === null) {
            throw new BackendError(
                `Function call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        let callee = getFunctionInstance(functionRef, context.bare(), regen);

        // Check if callee is generated yet. If not we'll generate it.
        if (!callee) {
            let calleeNode = functionRef.source,
                parent = calleeNode.parentNode,
                name = calleeNode.relativeName;

            // Anon. IR builder
            let calleeContext = context.bare();

            callee = regen(name, parent, calleeContext);
        }

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
