import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import mangleTypeChildren from '../helper/mangleTypeChildren';
import generateFunctionMangle from '../helper/generateFunctionMangle';

/**
 * This resolves and mangles a function declaration. This applies to functions
 * and does not support lambdas or such.
 */
export default class ResolveFunctionDeclaration extends Transformation {
    constructor() {
        super(t.FunctionStatement, "Resolve::FunctionDeclaration");
    }
    
    modify(node: Node, tool: ASTTool) {
        let rootName = node.name.identifier.rootId;
        let args = node.args || [];
        
        // Generate 2D mangled arg names  
        let resArgs = new Array(args.length);
        
        console.log("start: ");
        console.log(node.name.toString());
        console.log(new Error().stack);
        for (var i = 0; i < args.length; i++) {
            if (!args[i].typedId.type) {
                throw new TypeError(`Function ${rootName} has no type for pos ${i}.`);
            }

            if (args[i].typedId.type instanceof t.Identifier) {
                resArgs[i] = [
                    args[i].typedId.identifier.identifier.rootId,
                    args[i].typedId.type.identifier.rootId
                ];
                continue;
            }

            resArgs[i] = [
                args[i].typedId.identifier.identifier.rootId,
                mangleTypeChildren(args[i].typedId.type.path, tool)
            ];
        }
        
        // Now that everything is simplified, we can 
        var oldQueueQualifier = node.name;
        
        node.name = new t.Identifier(
            generateFunctionMangle(rootName, resArgs, tool),
            node.name.position
        );

        console.log("end: ");
        console.log(node.name.toString());
        
        tool.gc(oldQueueQualifier);
        
        tool.notifyScopeChange();
    }
}
