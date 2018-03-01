import BackendWatcher from '../../BackendWatcher';
import BackendWarning from '../../BackendWarning';
import t from '../../../parser/nodes';

export default class LLVMBitCastExpression extends BackendWatcher {
    match(type) {
        return type instanceof t.BinaryExpression && type.op == '::';
    }

    receive(node, tool, regen, context) {
        let value = regen('rhs', node, context);
        return context.builder.createBitCast(value, lhs.aliasRef);
    }
}
