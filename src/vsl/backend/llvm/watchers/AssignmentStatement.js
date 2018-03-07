import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

export default class LLVMAssignmentStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.AssignmentStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        node.ref.backendRef = regen('value', node, context);
    }
}
