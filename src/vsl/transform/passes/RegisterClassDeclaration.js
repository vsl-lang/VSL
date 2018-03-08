import Transformation from '../transformation';
import TransformError from '../transformError.js';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeInitItem from '../../scope/items/scopeInitItem';

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

        // Also check if there is an initalizer, if not add the default init.
        let isInitializer = false;
        for (let i = 0; i < node.statements.statements.length; i++) {
            const statement = node.statements.statements[i];
            if (statement instanceof t.InitializerStatement) {
                isInitializer = true;
                break;
            }
        }

        // Add default init if doesn't exist
        if (isInitializer === false) {
            let type = new ScopeInitItem(
                ScopeForm.definite,
                node.scopeRef.rootId,
                {
                    args: [],
                    source: null,
                    isDefaultInit: true,
                    returnType: node.scopeRef,
                    initializingType: node.scopeRef
                }
            );

            // Get scope inside class
            const scope = node.statements.scope;

            // Get outer scope
            const outerScope = tool.scope;

            // Also register as a class init
            let resOutside = outerScope.set(type);

            // Register the type in the parent scope
            let resInsideClass = scope.set(type);
        }
    }
}
