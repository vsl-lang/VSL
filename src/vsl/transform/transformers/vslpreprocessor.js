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

            // Converts BinaryExpression(=) to AssignmentExpression
            pass.TransformAssignmentExpression,

            // Converts BinaryExpression(::) to CastExpression
            pass.TransformCastExpression,

            // Ensure LValues are correct,
            pass.VerifyLValue,

            // Marks global assignment
            pass.TransformGlobalAssignment,

            // Checks, pretty important. Type checks are preformed by the
            // deductor.
            pass.VerifyFunctionAccessScope,
            pass.VerifyAnnotationSignature,

            // Verify dynamic field statement
            pass.VerifyDynamicFieldDeclaration,

            // Verify operator overloads are correctly defined
            pass.VerifyOperatorOverload,

            // Verifys external assignment statements are well-formed
            pass.VerifyExternalAssignment,

            // Registers a @primitive mark specifying that a class defines
            // behavior for one.
            pass.DescribePrimitiveAnnotation,

            // Registers @mock so prepared ScopeItem can capture
            pass.DescribeTypeMockAnnotation,

            // Registers @dynamic() to avoid primitive dynamic dispatch.
            pass.DescribeDynamicAnnotation,

            // Registers @booleanProvider
            pass.DescribeBooleanProvider,

            // Registers @optionalType
            pass.DescribeOptionalProvider,

            // Registers @staticEnumProvider
            pass.DescribeStaticEnumProvider,

            // Registers @manifestAsRoot
            pass.DescribeManifestAsRoot,

            // Add to first scope pass
            // adds just the name and ref to class
            pass.DescribeClassDeclaration,

            // Registers enum
            pass.DescribeEnumerationDeclaration,

            // Registers the cases for enums
            pass.DescribeEnumerationCase,

            // Registers type alias
            pass.DescribeTypeAlias
        ], context);
    }
}
