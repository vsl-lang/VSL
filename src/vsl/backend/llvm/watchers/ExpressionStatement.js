import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

export default class LLVMExpressionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ExpressionStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        if (tool.nthParent(2)?.rootScope) {
            backend.warn(new BackendWarning(
                "Top-level expressions will be ignored",
                node
            ));
        } else {
            regen('expression', node, context);
        }
    }
}
