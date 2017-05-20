import Transformation from '../transformation.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import generateTypeMangle from '../helper/generateTypeMangle';
import mangleTypeChildren from '../helper/mangleTypeChildren';

/**
 * Resolved type paths to their LLVM argument form. `Type { [A, B] }` becomes
 * `A.B` for example.
 */
export default class ResolveTypePath extends Transformation {
    constructor() {
        super(t.Type, "Resolve::TypePath");
    }
    
    modify(node: Node, tool: ASTTool) {
        tool.replace(
            new t.Identifier(
                generateTypeMangle(
                    mangleTypeChildren(node.path, tool),
                    node.optional
                )
            )
        );
        
        tool.notifyScopeChange();
        tool.gc(); // GC's child objects.
    }
}