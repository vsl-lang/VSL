/**
 * Node class for AST.
 */
export default class Node {
    
    /**
     * Friendly name of node used in errors and such. Make sure to not capitalize
     * @type {string}
     */
    get fancyName() {
        return "node";
    }
    
    /**
     * Creates a new Node object.
     */
    constructor(position: Object) {
        this.position = position;
        
        /**
         * If exists, references the closest scope. Use an ASTTool to perform
         * variable lookups
         *
         * @type {?CodeBlock}
         */
        this.parentScope = null;
        
        /**
         * If exists, a traverser will set this to the parent node or wrapping
         * container.
         *
         * @type {?(Node | Node[])}
         */
        this.parentNode = null;
        
        /**
         * An integer representing the position within a queue to qualify the
         * node for a GC pass when requested by a parent.
         *
         * A {@link Transformer} will automatically do this.
         *
         * If you set this, the ASTTool for the node should process with a
         * transformer.
         *
         * @type {?number}
         */
        this.queueQualifier = null;
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
     * Returns all the children of a node. The order must be consistent
     * @type {?Node[]}
     */
    get children() {
        throw new Error("Must implement Node#children");
    }
    
    /**
     * Returns the string representation of the Node.
     * @return {string} Tree representation of this node.
     */
    toAst() {
        let children = this.children;
        let string = `\u001B[1m${this.constructor.name}\u001B[0m` + "\n";
        let indentamt = " ";
        
        function indent(string, isLast) {
            let marker = !isLast ? ' │ ' : '   ';
            return string.replace(/\n(.)/g, `\n${marker}$1`)
        }
        
        function addSpacing(string) {
            return string.replace(/\n(.)/g, `\n $1`)
        }
        
        if (!children) return string;
        for (let i = 0; i < children.length; i++) {
            let child = this[children[i]];
            let isLast = i === children.length - 1;
            let connector = isLast ? ` └ ` : ` ├ `// + `(${i} ${children.length - 1})`;
            
            if (child instanceof Array) {
                string += connector + children[i] + "[]" + "\n";
                for (let j = 0; j < child.length; j++) {
                    let lastSub = j === child.length - 1;
                    let subConnector = lastSub ? " └ " : " ├ ";
                    let subchild = child[j];
                    
                    string += indentamt + subConnector + addSpacing(indent(subchild.toAst(), lastSub));
                }
            } else if (child) {
                string += connector + `\u001B[2m${children[i]}:\u001B[0m ` + indent(child.toAst(), isLast);
            } else {
                string += connector + `\u001B[2m${children[i]}:\u001B[0m ` + "\u001B[31mnull\u001B[0m\n";
            }
        }
        
        return string;
    }
    
    // /**
    //  * Returns the string representation of the Node.
    //  * @param {string} padding String to add to the left of the tree
    //  * @return {string} Tree representation of this node.
    //  */
    // toAST (padding: String='') {
    //     let children = this.children;
    //     if (this.unbox)
    //         return padding + '"' + this.children + '"\n';
    //     let result = '';
    //     if (this.type === NodeType.BinaryExpression || this.type === NodeType.UnaryExpression)
    //         result = result + padding + operator_names[this.operator_type] + '\n';
    //     else
    //         result = result + padding + this.constructor.name + '\n';
    //     if (padding.length >= 3) {
    //         let last_chars = padding.slice(-1);
    //         if (last_chars === '├')
    //             padding = padding.slice(0, -1) + '│';
    //         else if (last_chars === '└')
    //             padding = padding.slice(0, -1) + ' ';
    //     }
    //     if (typeof this.children === 'string')
    //         result = result + padding + '└"' + this.children + '"\n';
    //     else if (this.children.length !== 0) {
    //         let new_padding = padding + '├';
    //         for (let i = 0; i < this.children.length - 1; i++)
    //             result += this.children[i].toAST(new_padding);
    //         new_padding = padding + '└';
    //         let item = this.children[this.children.length - 1];
    //         result += item.toAST(new_padding);
    //     }
    //     return result;
    // }
    
}
