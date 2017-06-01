import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import ScopeFuncItem from '../../scope/items/scopeFuncItem';

/**
 * Registers a class declaration. Does NOT register any of the child functions
 * or such.
 * 
 * This may call other registrars declared further down the line without this
 * being completed in terms of generation
 */
export default class TypeDeductAssignment extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Register::FunctionDeclaration");
    }
    
    modify(node: Node, tool: ASTTool) {
        // // The root class name (primary associate in scope)
        // let rootId = node.name.identifier.rootId;
        // // The subscope
        // let statements = node.statements;
        
        // // ScopeTypeItems ths can be cast too
        // let castables = []; 
        
        
        // let type = new ScopeTypeItem(
        //     /*rootId:*/ rootId,
        //     /*subscope:*/ node.statements,
        //     {
        //         castables: castables,
        //         isInterface: false
        //     }
        // );
        
        // // Register the type in the parent scope
        // let res = this.parentScope.scope.set(type);
        // if (res === false) {
        //     throw new TransformError(
        //         "Redeclaration of function. This means you have a function " +
        //         "",
        //         node
        //     );
        // }
    }
}