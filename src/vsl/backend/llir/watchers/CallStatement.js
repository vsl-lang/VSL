import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        let callCandidates = node.head.typeCandidates;
        
        // There should only be one function candidate for a call
        if (callCandidates.length === 1) {
            // TODO: handle
            console.warn('bork alert');
        }
        
        let candidate = callCandidates[0];
        
        // Compile the arguments
        let arg = [];
        for (let i = 0; node.arguments.length; i++) {
            arg.push(
                regen(
                    i, node.arguments, context
                )
            );
        }
    }
}
