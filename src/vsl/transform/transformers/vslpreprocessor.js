import Transformer from '../transformer';
import * as pass from '../passes/';

/**
 * Preprocesses and simplifies VSL code (adds default initalizers and whatnot)
 * 
 * See: {@link Transformer}
 */
export default class VSLPreprocessor extends Transformer {
    constructor() {
        super([
            pass.FoldFiniteIntegerRange,
            pass.FoldBinaryIntegerExpression,
            
            pass.VerifyFunctionAccessScope,
            
            pass.ResolveTypePath,
            pass.ResolveGenericArgument,
            pass.ResolveFunctionDeclaration,

            pass.DescribeClassDeclaration,
            // pass.DescribeFunctionDeclaration,
            pass.DescribeVariableAssignment
        ]);
    }
}
