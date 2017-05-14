import Transformer from '../transformer';
import * as pass from '../passes/';

/**
 * A default transformer initalized to the passes described in `passes/`
 * 
 * See: {@link Transformer}
 */
export default class VSLTransformer extends Transformer {
    constructor() {
        super([
            pass.FoldFiniteIntegerRange,
            pass.FoldBinaryIntegerExpression,
            
            pass.VerifyFunctionAccessScope
        ]);
    }
}