import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

export default class LLVMFunctionCall extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionCall;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        console.log(node);
    }
}
