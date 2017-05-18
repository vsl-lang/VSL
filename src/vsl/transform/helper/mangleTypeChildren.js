import Identifier from '../../parser/nodes/identifier';

/**
 * Takes an array of nodes and gives you a mangled path.
 * 
 * @param {Node[]} path - The child type reference
 * @param {ASTTool} - The node's AST tool to requeue
 * 
 * @return {string[]} The mangled result of paths
 */
export default function mangleTypeChildren(path: Node[], tool: ASTTool) {
    let resArgs = [];
        
    // Resolve sub-generics
    for (let i = 0; i < path.length; i++) {
        if (path[i] instanceof Identifier) {
            resArgs.push(path[i].identifier.id);
            continue;
        }
        
        // Process each node if applicable
        tool.queueThenDeep(path[i], path, i, null);
        
        if (path[i] instanceof Identifier) {
            resArgs.push(path[i].identifier.id);
        } else {
            if (process.env.VSL_ENV === "dev_debug") console.log(args, node);
            throw new TypeError(`At ${i} positional in generic, it was not simplified to identifier. It is ${args[i].constructor.name}`);
        }
    }
    
    return resArgs;
}