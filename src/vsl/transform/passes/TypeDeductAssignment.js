import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

import ScopeTypeItem from '../../scope/items/scopeTypeItem';

/**
 * Type deducts basic assignment statements
 *
 * @example
 * var a: T = b
 */
export default class TypeDeductAssignment extends Transformation {
    constructor() {
        super(t.AssignmentStatement, "TypeDeduct::AssignmentStatement");
    }

    modify(node: Node, tool: ASTTool) {
        let types = null;
        
        // If we have an expected type (e.g. let a: T) then this passes T.
        if (node.expectedType) {
            types = [
                new TypeCandidate(node.expectedType)
            ];
        }
        
        let resolver = new RootResolver(node.value, vslGetChild, tool.context)
            .resolve((constraint) => {
                switch (constraint) {
                    case ConstraintType.RequestedTypeResolutionConstraint:
                        return types;
                    default:
                        return null;
                }
            });
    }
}
