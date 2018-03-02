import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

/**
 * Indiscriminately generates the code block in an assumed existing builder
 * context.
 */
export default class LLVMCodeBlock extends BackendWatcher {
    match(type) {
        return type instanceof t.CodeBlock;
    }

    receive(node, tool, regen, context) {
        const backend = context.backend;

        for (let i = 0; i < node.statements.length; i++) {
            regen(i, node.statements, context);
        }
    }
}
