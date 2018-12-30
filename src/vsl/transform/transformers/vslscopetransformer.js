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
            pass.RegisterTypeAlias,
            pass.RegisterFunctionDeclaration,
            pass.RegisterClassDeclaration,
            pass.RegisterEnumerationDeclaration,
            pass.RegisterInitDeclaration,
            pass.RegisterDynamicFieldStatement,

            // Ensure function overloading/dynamic dispatch
            pass.VerifyDynamicDispatch,

            // Check return statements are correctly formed.
            pass.VerifyReturnStatement,

            // Check return statements are correctly formed.
            pass.VerifyDynamicFieldStatementReturnStatement,

            // Verify operators are declared correctly
            pass.VerifyOperatorOverloadType,

            // Function annotation support
            pass.DescribeInlineAnnotation,

            // @foreign
            pass.DescribeForeignAnnotation,
        ], context);
    }
}
