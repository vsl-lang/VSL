import Transformer from '../transformer';
import * as Transformations from '../passes/';

/**
 * A default transformer initalized to the passes described in `passes/`
 * 
 * See: {@link Transformer}
 */
export default class VSLTransformer extends Transformer {
    constructor() {
        super(Object.values(Transformations));
    }
}