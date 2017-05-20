import Identifier from '../../parser/nodes/identifier';

/**
 * Mangles a single `Type` node.
 * 
 * @param {Node|Node[]} parent - The parent of the type to mangle
 * @param {number|string} name - The name of the node relative to the parent
 * @param {ASTTool} tool - The node's AST tool to requeue
 * 
 * @return {string} The mangled result
 */
export default function mangleTypeChild(parent: Node | Node[], name: number | string, tool: ASTTool) {
    const node = parent[name];
    if (node instanceof Identifier) {
        return node.identifier.id
    }
    
    // Process each node if applicable
    tool.queueThenDeep(node, parent, name, null);
    
    if (node instanceof Identifier) {
        return node.identifier.id;
    } else {
        if (process.env.VSL_ENV === "dev_debug") console.log(args, node);
        throw new TypeError(`At ${name} child for node of ${parent.constructor.name}, it was not simplified to identifier.`);
    }
}