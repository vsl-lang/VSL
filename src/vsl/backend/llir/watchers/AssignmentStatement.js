import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRAssignmentStatement extends BackendWatcher {
    static type = t.AssignmentStatement
    
    receive(node, backend, stream, tool, regen) {
        // They are two important things we need to know, 1) if it's a top-level
        // 2) if it's a complex type. Meaning if it's initalized to a literal
        // we'd need to layout that literal in the DATA section and assign the
        // register for this statement to it.
        
        // If this is top-level we're going to do some special assignment
        if (node.parentScope.rootScope === true) {
            // In this case we're going to need to verify that this top-level
            // value is indeed a constant
            
            // Additionally the context is needed to check for constant-ness
        } else {
            
        }
    }
}
