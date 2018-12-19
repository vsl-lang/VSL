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
        node.reference.resolve();
        const reference = node.reference;

        ////////////////////////////////////////////////////////////////////////
        //                         Setup Inherit                              //
        ////////////////////////////////////////////////////////////////////////
        if (reference.superclass) {
            // Change the subscope's superscope to be the parent class.
            reference.subscope.superscope = reference.superclass.subscope;
        }


        ////////////////////////////////////////////////////////////////////////
        //                         Default Init                               //
        ////////////////////////////////////////////////////////////////////////

        // Also check if there is an initalizer, if not add the default init.
        let isInitializer = false;
        for (let i = 0; i < node.statements.statements.length; i++) {
            const statement = node.statements.statements[i];
            if (statement instanceof t.InitializerStatement) {
                isInitializer = true;
                break;
            }
        }

        if (isInitializer === false) {
            // Check all aliases have defined value/expression if creating
            //  implicit initializer.
            for (let i = 0; i < node.statements.statements.length; i++) {
                const alias = node.statements.statements[i];
                if (alias instanceof t.FieldStatement) {
                    // Check if has value
                    if (alias.value === null) {
                        throw new TransformError(
                            `Type has no initializers so an implicit ` +
                            `initializer was being created. For an implicit ` +
                            `initializer, all fields must have a default value.`,
                            alias
                        );
                    }
                }
            }
        }

        let type = new ScopeInitItem(
            ScopeForm.definite,
            'init',
            {
                args: [],
                source: null,
                isDefaultInit: true,
                returnType: node.reference.selfType,
                initializingType: node.reference
            }
        );

        if (isInitializer === false) {
            const subscope = node.statements.scope;

            // Register the init in the class's scope
            subscope.set(type);
        }
    }
}
