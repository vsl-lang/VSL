import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

/**
 * Redirects expression generation to the appropriate node.
 */
export default class JSExpressionStatement extends BackendWatcher {
    /** @override */
    match(type) {
        return type instanceof t.ExpressionStatement;
    }

    /** @override */
    receive(node, tool, regen, context) {
        return regen('expression', node, context);
    }
}
