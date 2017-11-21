import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRFunctionCallStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        let callCandidates = node.head.typeCandidates;
        
        // hi
        // There should only be one function candidate for a call
        if (callCandidates.length > 0) {
            // TODO: handle
            console.warn('bork alert');
        }
    }
}
