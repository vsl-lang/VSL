import Transformer from '../transformer';
import * as pass from '../passes/';

/**
 * Resolves VSL scoping.
 * See: {@link Transformer}
 */
export default class VSLScopeTransformer extends Transformer {
    constructor(context: TransformationContext) {
        super([
            // Checks, pretty important. Type checks are preformed by the
            // deductor.
            pass.RegisterTypeAlias
        ], context);
    }
}
