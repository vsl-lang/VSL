import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import Chain from '@/LLIR/ExecutionGraph/Node/Nodes/Chain';

/**
 * Generates a function call of a base.
 */
export default class LLIRFunctionCall extends BackendWatcher {
    /** @override */
    match(type) {
        return type instanceof t.FunctionCall;
    }

    /** @override */
    receive(node, tool, regen, context) {
        // First we need to make sure the referenced function is queued for
        // generation.
        let executionGraph = context.executionGraph;
        let parentAtom = context.graph.getAtom();

        // Check if root
        if (parentAtom instanceof Chain) {

        }
    }
}
