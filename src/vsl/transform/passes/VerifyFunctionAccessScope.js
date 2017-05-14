import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import AccessModifiers from '../data/accessModifiers';
import t from '../../parser/nodes';

/**
 * Verifies and determines if a functions access modifiers are valid within its
 * scope.
 * 
 * An example is if a function declared `static func` is outside of a function.
 * This does not implement access modifers either but just checks a function's
 * scope
 */
export default class VerifyFunctionAccessScope extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Verify::FunctionAccessScope");
    }
    
    /** @overide */
    modify(node: Node, tool: ASTTool) {
        // statement = node.parentScope?.parentNode
        let statement = node.parentScope
        statement = statement && statement.parentNode;
        
        let accessModifiers = node.access;
        
        if (statement instanceof t.ClassStatement || statement instanceof t.InterfaceStatement) {
            // A class function
            return;
        }
        
        if (node.parentScope.rootScope === true) {
            // Top-level function
            if (AccessModifiers.Membership.some(i => accessModifiers.includes(i))) {
                throw new TransformError("Non-methods may not be defined as static.", node)
            }
            return;
        }
        
        // Nested function
        if (accessModifiers.length > 0) {
            throw new TransformError("Functions inside scopes may not have any modifiers.", node);
        }
    }
}