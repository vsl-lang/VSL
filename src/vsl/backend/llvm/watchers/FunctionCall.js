import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import getFunctionName from '../helpers/getFunctionName';

export default class LLVMFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        // Get list of possible overloads
        // at this point there should only beo ne
        const functionRef = node.headRef;

        if (functionRef === null) {
            throw new BackendError(
                `Function call is ambiguous. Multiple possible references.`,
                node.head
            );
        }

        const calleeName = getFunctionName(functionRef);
        let callee = backend.module.getFunction(calleeName);

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

        return context.builder.createCall(
            callee,
            compiledArgs
        );
    }
}
