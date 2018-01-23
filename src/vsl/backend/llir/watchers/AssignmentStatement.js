import BackendWatcher from '../../BackendWatcher';
import * as utils from '../utils';
import t from '../../../parser/nodes';

import LLVMChainMain from '../nodes/LLVMChainMain';
import Chain from '@/LLIR/ExecutionGraph/Node/Nodes/Chain';

export default class LLIRAssignmentStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.AssignmentStatement;
    }

    receive(node, tool, regen, context) {
        // Generate code to add assignment statement.
        let assignment = context.make.wrapAtomic( context.make.chain([]) );

        // Add to graph
        let parent = context.graph.getAtom();

        // Determine if top level (i.e. chain main parent)
        if (parent instanceof LLVMChainMain) {
            // Top-level (place in the default chain main data)
            parent.pushEventDefaultGraph( assignment );
        } else if (parent instanceof Chain) {
            // Place in respective chain
            parent.pushEventGraph( assignment );
        } else {
            throw new TypeError(`Unexpected parent of assignment as ${
                parent.constructor.name
            }`);
        }
    }
}
