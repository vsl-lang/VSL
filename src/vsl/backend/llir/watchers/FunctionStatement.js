import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRFunctionStatement extends BackendWatcher {
    static type = t.CodeBlock
    
    receive(node, backend, stream, tool, regen) {
        
    }
}
