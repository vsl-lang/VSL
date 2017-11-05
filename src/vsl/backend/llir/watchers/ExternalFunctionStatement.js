import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRExternalFunctionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.FunctionStatement && type.statements instanceof t.ExternalMarker;
    }
    
    receive(node, tool, regen, context) {
        
    }
}
