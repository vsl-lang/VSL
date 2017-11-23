import BackendWatcher from '../../BackendWatcher';
import t from '../../../parser/nodes';

export default class LLIRExpressionStatement extends BackendWatcher {
    match(type) {
        return type instanceof t.ExpressionStatement;
    }
    
    receive(node, tool, regen, context) {
        return regen('expression', node, context);
    }
}
