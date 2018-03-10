import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

/**
 * Watcher for all functions which are not directly compiled
 */
export default class LLVMNoOp extends BackendWatcher {
    match(type) {
        return (
            type instanceof t.TypeAlias
        );
    }

    receive(node, tool, regen, context) {
        // We really don't need to do anything, the constructor is generated
        // on-demand
    }
}
