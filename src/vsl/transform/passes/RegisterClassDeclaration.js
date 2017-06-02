import Transformation from '../transformation';
import TransformError from '../transformError';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import ScopeTypeItem from '../../scope/items/scopeTypeItem';

/**
 * Registers a class declaration. Does NOT register any of the child functions
 * or such.
 * 
 * This may call other registrars declared further down the line without this
 * being completed in terms of generation
 */
export default class TypeDeductAssignment extends Transformation {
    constructor() {
        super(t.ClassStatement, "Register::ClassDeclaration");
    }
    
    modify(node: Node, tool: ASTTool) {
        // The root class name (primary associate in scope)
        let rootId, generic = null;
        
        if (node.name instanceof t.GenericDeclaration) {
            rootId = name.type.identifier.rootId;
            // generic = 
        } else {
            rootId = node.name.identifier.rootId;
        }
        
        // The subscope
        let statements = node.statements;
        
        // ScopeTypeItems ths can be cast too
        let castables = []; 
        
        
        let type = new ScopeTypeItem(
            /*rootId:*/ rootId,
            /*subscope:*/ node.statements,
            {
                castables: castables,
                isInterface: false
            }
        );
        
        // Register the type in the parent scope
        let res = this.parentScope.scope.set(type);
        if (res === false) {
            throw new TransformError(
                "Redeclaration of class. This class has already been declared" +
                " somewhere else, give this a unique name or remove one of " +
                "the conflicting classes.",
                node
            );
        }
    }
}