import Transformation from './transformation';
import ASTTool from './asttool';

/**
 * Takes an AST and transforms it according to a series of transformations
 * 
 * This is a generic class, reference VSLTransfomer for a VSL-specific
 * implementation
 * 
 * This takes a series of "passes" which are applied to the AST, each "pass"
 *  would return a new AST node which would be replaced (if specified as so).
 * This is now excluded and further matching AST nodes would be applied
 */
export default class Transformer {
    
    /**
     * Creates a new Transformer with the given passes
     * @param {Transformation[]} passes - The given passes to setup
     */
    constructor(passes: Transformation[]) {
        this.passes = passes;
        
        this.time = null;
    }
    
    /**
     * Transform the AST according the setup transformer
     * 
     * @param {any} ast - An AST as outputted by a `Parser`
     * @return A transformed AST with the passes applied
     */
    transform(ast: any) {
        if (ast.constructor === Array) {
            for (var i = 0; i < ast.length; i++) this.transform(ast[i]);
        } else {
            var t = process.hrtime();
            
            // Call the node's transform() method with the modification func
            ast.transform((node) => {
                let fragment = node;
                
                let tool = new ASTTool(fragment);
                for (var i = 0; i < passes.length; i++) {
                    // Check if correct type
                    if (node instanceof passes[i].type) {
                        // Call the passes' modify function
                        passes[i].modify(node, tool);
                        
                        let replacement = tool.replacement;
                        
                        // Clean the tool for reuse
                        // Unless res == fragment meaning no change occured
                        if (replacement && replacement === fragment)
                            tool.clean();
                        else
                            tool = new ASTTool( fragment = res );
                    }
                }
                
                return fragment;
            });
            
            this.time = process.hrtime(t);
        }
    }
}