import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

import Chain from '@/LLIR/ExecutionGraph/Node/Nodes/Chain';

export default class LLIRCodeBlock extends BackendWatcher {
    match(type) {
        return type instanceof t.CodeBlock;
    }

    receive(node, tool, regen, context) {
        // This will never run for the root scope because the generator only
        // runs sub-statements.
    }
}
