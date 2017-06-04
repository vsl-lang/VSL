import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';

import ScopeItem from '../../scope/scopeItem';

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
        
        new RootResolver(expression, vslGetChild)
            .resolve((type) => {
            if (type === ConstraintType.ContextParentConstraint)
                return node.identifier.type;
            else
                return null;
        });
        
        // Add to scope
        console.log(node);
    }
}
