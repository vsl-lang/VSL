import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';
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
            // We can't offer any constraints if we don't have the 1 context
            if (evalType === null) return null;

            if (type === ConstraintType.ContextParentConstraint)
                return new ScopeTypeItem(evalType.identifier.rootId);
            else
                return null;
        });

        node.typeCandidates = node.value.typeCandidates;

        // Add to scope
        let name = node.identifier.identifier.identifier.rootId;
        let res = node.parentScope.scope.set(
            new ScopeAliasItem(
                name,
                node.value.typeCandidates,
                node.value
            )
        );

        if (res === false) {
            throw new TransformError(
                `Already declared identifier \`${name}\` in scope.`,
                node
            );
        }
    }
}
