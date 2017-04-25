/**
 * Node class for AST.
 */
export default class Node {
    /**
     * Creates a new Node object.
     */
    constructor(position: Object) {
        // this.position = position;
    }
    
    /**
     * Generates an string representing the AST from a generator.
     * 
     * The string should use the passed generator to create the outputting
     * string so padding is correct.
     * 
     * @abstract
     * @param {Generator} generator the target generator
     **/
     generate(generator: Generator) {
         throw new TypeError("generate(generator:) must be overriden");
     }
    
    /**
     * Returns the string representation of the Node.
     * @param {string} padding String to add to the left of the tree
     * @return {string} Tree representation of this node.
     */
    toString (padding: String='') {
        // if (!node_names[this.type].size())
        //     return padding + '"' + this.data + '"\n';
        // let result = '';
        // if (this.type === NodeType.BinaryExpression || this.type === NodeType.UnaryExpression)
        //     result = result + padding + operator_names[this.operator_type] + '\n';
        // else
        //     result = result + padding + node_names[this.type] + '\n';
        // if (padding.length >= 3) {
        //     let last_chars = padding.slice(-1);
        //     if (last_chars === '├')
        //         padding = padding.slice(0, -1) + '│';
        //     else if (last_chars === '└')
        //         padding = padding.slice(0, -1) + ' ';
        // }
        // if (this.data)
        //     result = result + padding + '└"' + this.data + '"\n';
        // else if (this.children.length)) {
        //     let new_padding = padding + '├';
        //     for (let i = 0; i < this.children.length - 1; i++)
        //         result += this.children[i].toString(new_padding);
        //     new_padding = padding + '└';
        //     let item = this.children[this.children.length - 1];
        //     result += item.toString(new_padding);
        // }
        // return result;
    }
}