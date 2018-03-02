import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

/**
 * Indiscriminately generates the code block in an assumed existing builder
 * context.
 */
export default class LLVMExpressionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ExpressionStatement;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        if (!context.builder) {
            backend.warn(new BackendWarning(
                `Expression must be in function. Ignoring...`,
                node
            ));
            return;
        }

        return regen('expression', node, context);
    }
}
