import Transformer from '../transformer';
import * as pass from '../passes/';

/**
 * Resolves early VSL expressions (globals, fields).
 * See: {@link Transformer}
 */
export default class VSLPretransformer extends Transformer {
    constructor(context: TransformationContext) {
        super([
            pass.TypeDeductField,
            pass.TypeDeductGlobal,

            // Verify initializer body is correct order
            pass.VerifyInitializerFormat,

            // Verify initalizers are semantically meaningful
            pass.VerifyInitDelegationFormat,
        ], context);
    }
}
