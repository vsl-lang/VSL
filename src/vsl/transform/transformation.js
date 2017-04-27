/**
 * A transformation or a pass for a `Transformer`
 * 
 * Subclass this and pass it to a `Transformer` to apply it to an AST. Each is
 * passed a `ASTTool` object to aid in modifying and transversing the AST.
 * 
 * @abstract
 */
export default class Transformation {
    /**
     * Creates a new transformation object
     * 
     * @param {Class} type - the node type to match which is subclass of Node
     * @param {string} name - the name of the transformation object, for debug purposes
     */
    constructor(type: Class<Node>, name: any) {
        /** @type {Class<Node>} */
        this.type = type.
        /** @type {string} */
        this.name = name;
    }
    
    /**
     * Modifies a given AST fragment with the `tool`
     * 
     * @param {Node} node - The node being applied on
     * @param {ASTTool} tool - The ASTTool for modifications
     * 
     * @abstract
     */
    modify(node: Node, tool: ASTTool) {
        
    }
}