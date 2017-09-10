import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class JSFunctionStatement extends BackendWatcher {
    static type = t.FunctionStatement
    
    receive(node, backend, stream, tool, regen) {
        // 
    }
}
