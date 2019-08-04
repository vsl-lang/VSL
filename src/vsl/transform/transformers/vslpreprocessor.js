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
            pass.TransformShortCircut, // Transform binary short-circut to their dedicated nodes
            pass.TransformAssignmentExpression, // Converts BinaryExpression(=) to AssignmentExpression
            pass.TransformCastExpression, // Converts BinaryExpression(::) to CastExpression

            // Ensure LValues are correct,
            pass.VerifyLValue,

            // Marks global assignments as such
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

            pass.DescribePrimitiveAnnotation, // Registers a @primitive mark specifying that a class defines behavior for one.
            pass.DescribeTypeMockAnnotation, // Registers @mock so prepared ScopeItem can capture
            pass.DescribeDynamicAnnotation, // Registers @dynamic() to avoid primitive dynamic dispatch.
            pass.DescribeBooleanProvider, // Registers @booleanProvider
            pass.DescribeOptionalProvider, // Registers @optionalType
            pass.DescribeStaticEnumProvider, // Registers @staticEnumProvider
            pass.DescribeManifestAsRoot, // Registers @manifestAsRoot

            pass.DescribeClassDeclaration, // Registers the class in the scope list (first pass)
            pass.DescribeInterfaceDeclaration, // Registers the interface in the scope list (first pass)

            // Registers enum
            pass.DescribeEnumerationDeclaration,

            // Registers the cases for enums
            pass.DescribeEnumerationCase,

            // Registers type alias
            pass.DescribeTypeAlias
        ], context);
    }
}
