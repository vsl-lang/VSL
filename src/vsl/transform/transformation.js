/**
 * A transformation or a pass for a `Transformer`
 *
 * ### Usage
 *
 * Subclass this and pass it to a `Transformer` to apply it to an AST. Each is
 * passed a `ASTTool` object to aid in modifying and traversing the AST. Never
 * use anything but the ASTTool for modification. Additionally do not attempt to
 * use any undocumented methods of `ASTTool`, as.
 *
 * Override:
 *  - The constructor to provide the node type to run the transformation upon
 *     and the transformation's name.
 *  - The `modify(node:tool:)` method of this class.
 *
 * Refer to the {@link ASTTool} reference for further information.
 *
 * ### Information
 *
 * A transformation is loaded into a transformer and it automatically called
 * where applicable. A transformer should not queue or delegate any further
 * nodes to transformation, nor should it attempt to mutate the AST without the
 * use of an ASTTool.
 *
 * ### Timing
 *
 * Each Transformation is individually timed and tracked by a {@link Transformer}. The
 * timing information is obtained through the `transform(ast:parent:)` method for
 * any and all routed transformations. It is available accurate to microsecond
 * precision and should be used for all transformations to ensure the most efficient
 * transformations are occuring.
 *
 * Transformations are recursive any may run on replaced nodes if the transformer
 * deems correct. You may need to specify specifically if your Transformation
 * requests specific queuing priority or transformation status to avoid extra runs
 * and calls.
 *
 * @example
 * import Transformation from '../transformation';
 * import TokenType from '../../parser/vsltokentype';
 * import t from '../../parser/nodes';
 *
 * export default class MyTransformer extends Transformation {
 *     constructor() {
 *          super(t.Expression, "TransformerType::TransformerName");
 *     }
 *
 *     modify(node: Node, tool: ASTTool) {
 *         // ... modifications
 *         tool.replace( newNode );
 *     }
 * }
 *
 * @abstract
 */
export default class Transformation {
    /**
     * Creates a new transformation object
     *
     * @param {Class<Node>} type - the node type to match which is subclass of Node
     * @param {string} name - the name of the transformation object, for debug purposes
     */
    constructor(type: Class<Node>, name: any) {
        /** @type {Class<Node>} */
        this.type = type;
        /** @type {string} */
        this.name = name;
    }
    
    /**
     * Modifies a given AST fragment with the `tool`.
     *
     * This is the primary function which you must implement to create a
     * transformer. You can specifically specify the node type this executes upon
     * through specifying the "type" field in the `super` call within your
     * constructor.
     *
     * To run upon any time, pass `null` to the constructor. Never pass undefined
     * to a field unless specifically noted. If you do happen to pass null you
     * must perform type checking yourself by using `instanceof` with a node type.
     *
     * You likely need access to the node classes to check if a node is of a
     * specific type, you can import this using:
     *
     *      import t from '../../parser/nodes';
     *
     * This file is automatically updated based on the directory contents at
     * build-time.
     *
     * This methods execution shuold generally be controlled by a `Transformer`
     * or a seperate parent object to interface with the delegates.
     *
     * @param {Node} node - The node being applied on
     * @param {ASTTool} tool - The ASTTool for modifications
     *
     * @abstract
     */
    modify(node: Node, tool: ASTTool) {
        throw new TypeError("Must overload Transformation#modify(node, tool)");
    }
}
