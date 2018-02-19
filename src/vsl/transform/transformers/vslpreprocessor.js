import Transformer from '../transformer';
import * as pass from '../passes/';

/**
 * Preprocesses and simplifies VSL code (adds default initalizers and whatnot)
 *
 * See: {@link Transformer}
 */
export default class VSLPreprocessor extends Transformer {
    constructor(context: TransformationContext) {
        super([
            // Checks, pretty important. Type checks are preformed by the
            // deductor.
            pass.VerifyFunctionAccessScope,
            pass.VerifyAnnotationSignature,
            // pass.VerifyLoneLiterals,

            // Registers a @primitive mark specifying that a class defines
            // behavior for one.
            pass.DescribePrimitiveAnnotation,

            // Registers _mockType so prepared ScopeItem can capture
            pass.DescribeTypeMockAnnotation,

            // Add to first scope pass
            // adds just the name and ref to class
            pass.DescribeClassDeclaration,
            pass.DescribeVariableAssignment,
            pass.DescribeTypeAlias
        ], context);
    }
}
