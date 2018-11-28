import Transformation from '../transformation';
import TransformError from '../transformError';
import e from '../../errors';
import t from '../../parser/nodes';

import Scope from '../../scope/scope';
import ScopeForm from '../../scope/scopeForm';
import ScopeEnumItem from '../../scope/items/scopeEnumItem';

import GenericInfo from '../../scope/items/genericInfo';

/**
 * A pre-processing entry for an enumeration.
 */
export default class DescribeEnumerationDeclaration extends Transformation {
    constructor() {
        super(t.EnumerationStatement, "Describe::EnumerationDeclaration");
    }

    modify(node: Node, tool: ASTTool) {
        let scope = node.parentScope.scope;
        let enumName = node.name.value;

        let subscope = node.statements.scope;
        const staticSubscope = new Scope();

        let opts = {
            subscope: node.statements.scope,
            isInterface: false,
            subscope: subscope,
            source: node,
            staticScope: staticSubscope,
            isScopeRestricted: tool.isPrivate,
            genericInfo: new GenericInfo({ parameters: [] }),
            resolver: (self) => {
                self.backingType = tool.context.staticEnumerationType;
            }
        };

        const type = new ScopeEnumItem(
            ScopeForm.indefinite,
            enumName,
            opts
        );

        if (scope.set(type) === false) {
            throw new TransformError(
                `Duplicate declaration of enum ${enumName}. In this scope ` +
                `there is already another class or enum with that name.`,
                node, e.DUPLICATE_DECLARATION
            );
        }

        subscope.owner = type;
        staticSubscope.owner = type;
        staticSubscope.isStaticContext = true;
        node.reference = type;
    }
}
