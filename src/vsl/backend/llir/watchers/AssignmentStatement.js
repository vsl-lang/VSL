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
        let assignment = context.make.wrapAtomic( context.make.chain([]) );
        
        // Add to graph
        let parent = context.graph.getAtom();
        if (parent instanceof LLVMChainMain) {
            
            parent.pushEventDefaultGraph( assignment );
            
        } else if (parent instanceof Chain) {
            parent.pushEventGraph( assignment );
        } else {
            throw new TypeError(`Unexpected parent of assignment as ${
                parent.constructor.name
            }`);
        }
    }
}
