import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import generateGenericMangle from '../helper/generateGenericMangle';
import mangleTypeChildren from '../helper/mangleTypeChildren';

/**
 * This transformer resolves and automatically performs generic mangling. This
 * runs on all `Generic` arguments. This does **not** run checking of _what_ the
 * generic argument actually is.
 * 
 * What this transformer does is look for any argument in the format of `A<T>`.
 * The scope then looks up `A` and returns the object. The class the has `[T]`
 * added to the list of generics to generate. The helper `GenerateGenericMangle`
 * is called. The argument type is then updated. The `GenerateGenericClasses`
 * transformer will actually implement the generic creation. Additionally the
 * `StripGenericArgumentType` will remove the generic argument from the type
 * itself.
 * 
 * We'll recursively simplify the generic. An example would be the Type:
 * 
 *     A<T<U>, V<W, X>>
 * 
 * would become:
 * 
 *     A.generic.O$T.generic.U.V.generic.O$W.X$C$$C$
 * 
 * or simply:
 * 
 *     A.generic.<T.generic.U, V.generic.<W,X>>
 * 
 * and with full ids (LLVM):
 * 
 *     @"A<T<U>,V<W,X>>"
 */
export default class ResolveGenericArgument extends Transformation {
    constructor() {
        super(t.Generic, "Resolve::GenericArgument");
    }
    
    modify(node: Node, tool: ASTTool) {
        let root = node.type.identifier.rootId;
        let args = node.parameters;
        
        let resArgs = [];
        
        // First, if they are sub-generics, we must resolve those first.
        if (args instanceof Array) {
            resArgs = mangleTypeChildren(args, tool);
        }
        
        // Now that everything is simplified, we can 
        tool.replace(
            new t.Identifier(
                generateGenericMangle(root, resArgs)
            )
        );
        
        tool.notifyScopeChange();
        tool.gc(); // GC's child objects.
    }
}