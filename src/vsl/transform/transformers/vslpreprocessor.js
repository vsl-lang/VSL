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

            // Registers a @primitive mark specifying that a class defines
            // behavior for one.
            pass.RegisterPrimitiveAnnotation,
            pass.RegisterPassAnnotation,

            // Converts a type to what it will
            // be after mangling, not sure how
            // typealiases will be handled.
            pass.ResolveFunctionDeclaration,
            pass.ResolveTypePath,
            pass.ResolveGenericArgument,

            // Add to first scope pass
            // adds just the name and ref to class
            pass.DescribeClassDeclaration,
            pass.DescribeFunctionDeclaration,
            pass.DescribeVariableAssignment
        ], context);
    }
}
