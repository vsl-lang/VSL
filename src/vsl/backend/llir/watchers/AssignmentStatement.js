import BackendWatcher from '../../BackendWatcher';
import * as utils from '../utils';
import t from '../../../parser/nodes';

export default class LLIRAssignmentStatement extends BackendWatcher {
    static type = t.AssignmentStatement
    
    receive(node, backend, stream, tool, regen) {
        
    }
}
