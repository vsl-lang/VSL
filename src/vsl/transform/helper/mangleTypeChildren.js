import Identifier from '../../parser/nodes/identifier';

/**
 * Takes an array of nodes and gives you a mangled path. This operates on
 * `Type`s and its subclasses and child nodes. 
 * 
 * You usually want to call this on the `Type#path` property where you know the
 * node for sure is a `Type`, otherwise use `mangleTypeChildren`
 * 
 * @param {Node[]} path - The child type reference
 * @param {ASTTool} tool - The node's AST tool to requeue
 * 
 * @return {string[]} The mangled result of paths
 */
export default function mangleTypeChildren(path: Node[], tool: ASTTool) {
    let resArgs = [];
        
    // Resolve sub-generics
    for (let i = 0; i < path.length; i++) {
        if (path[i] instanceof Identifier) {
            resArgs.push(path[i].identifier.rootId);
            continue;
        }
        
        // Process each node if applicable
        tool.queueThenDeep(path[i], path, i, null);
        
        if (path[i] instanceof Identifier) {
            resArgs.push(path[i].identifier.rootId);
        } else {
            if (process.env.VSL_ENV === "dev_debug") console.log(args, node);
            throw new TypeError(`At ${i} positional in generic, it was not simplified to identifier. It is ${args[i].constructor.name}`);
        }
    }
    
    return resArgs;
}