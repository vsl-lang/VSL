import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeTypeAliasItem from '../../scope/items/scopeTypeAliasItem';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

/**
 * A pre-processing entry for a class declaration. This goes top-down and
 * "registers" or adds the class to a global table of all items for at least
 * that scope.
 */
export default class RegisterClassDeclaration extends Transformation {
    constructor() {
        super(t.ClassStatement, "Register::ClassDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        node.scopeRef.resolve();
    }
}
