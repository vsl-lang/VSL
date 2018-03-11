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
            // Transform binary short-circut to their dedicated nodes
            pass.TransformShortCircut,

            // Checks, pretty important. Type checks are preformed by the
            // deductor.
            pass.VerifyFunctionAccessScope,
            pass.VerifyAnnotationSignature,

            // Verify initializer body is correct order
            pass.VerifyInitializerFormat,

            // Verify initalizers are semantically meaningful
            pass.VerifyInitDelegationFormat,

            // Verify operator overloads are correctly defined
            pass.VerifyOperatorOverload,

            // Registers a @primitive mark specifying that a class defines
            // behavior for one.
            pass.DescribePrimitiveAnnotation,

            // Registers _mockType so prepared ScopeItem can capture
            pass.DescribeTypeMockAnnotation,

            // Registers @dynamic() to avoid primitive dynamic dispatch.
            pass.DescribeDynamicAnnotation,

            // Registers @booleanProvider
            pass.DescribeBooleanProvider,

            // Add to first scope pass
            // adds just the name and ref to class
            pass.DescribeClassDeclaration,
            pass.DescribeTypeAlias
        ], context);
    }
}
