import CodeBlockManager from '../helpers/CodeBlockManager';
import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';

import ValueRef from '../ValueRef';

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

        const manager = new CodeBlockManager(node.scope, context);
        node.backendRef = manager;

        for (let i = 0; i < node.statements.length; i++) {
            regen(i, node.statements, context);
        }
    }
}
