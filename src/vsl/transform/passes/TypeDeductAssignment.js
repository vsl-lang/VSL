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
        let expression = node.value;
        if (expression === null) return;

        let evalType = node.identifier.type;
        new RootResolver(expression, vslGetChild, tool.context)
            .resolve((type) => {
            // We can't offer any constraints if we don't have the one context
            // we can offer
            if (evalType === null) return null;

            if (type === ConstraintType.RequestedTypeResolutionConstraint)
                return [
                    new TypeCandidate(
                        new ScopeTypeItem(evalType.identifier.rootId)
                    )
                ];
            else
                return null;
        });

        // Update ref candidates
        node.ref.candidates = node.value.typeCandidates;
    }
}
