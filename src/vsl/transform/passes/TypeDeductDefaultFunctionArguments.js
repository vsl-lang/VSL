import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import TypeCandidate from '../../resolver/typeCandidate';
import ConstraintType from '../../resolver/constraintType';

/**
 * Type deducts top-level expressions. Does not handle expressions within
 * contexts or such. This means this can allow void functions etc.
 *
 * @example
 * f$RVoid()
 */
export default class TypeDeductDefaultFunctionArguments extends Transformation {
    constructor() {
        super(t.FunctionArgument, "TypeDeduct::DefaultFunctionArguments");
    }

    modify(node: Node, tool: ASTTool) {
        const defaultValue = node.defaultValue;
        if (!defaultValue) return;

        const type = node.aliasRef.type;

        new RootResolver(defaultValue, vslGetChild, tool.context)
            .resolve((constraint) => {
                switch (constraint) {
                    case ConstraintType.RequestedTypeResolutionConstraint:
                        return new TypeCandidate(type);
                    case ConstraintType.RequireType:
                    case ConstraintType.SimplifyToPrecType:
                        return true;
                    case ConstraintType.VoidableContext:
                        return false;
                    default:
                        return null;
                }
            });
    }
}
