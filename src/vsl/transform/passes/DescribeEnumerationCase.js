import Transformation from '../transformation';
import TransformError from '../transformError';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeForm from '../../scope/scopeForm';
import ScopeStaticEnumCaseItem from '../../scope/items/scopeStaticEnumCaseItem';

/**
 * A pre-processing entry for an enumeration.
 */
export default class DescribeEnumerationCase extends Transformation {
    constructor() {
        super(t.EnumerationCase, "Describe::EnumerationCase");
    }

    modify(node: Node, tool: ASTTool) {
        const caseName = node.name.value;
        const staticScope = tool.staticScope;
        const enumReference = staticScope.owner;

        const enumCaseItem = new ScopeStaticEnumCaseItem(
            ScopeForm.definite,
            caseName,
            {
                caseIndex: enumReference.staticCases.length,
                source: node,
                type: enumReference
            }
        );

        const result = staticScope.set(enumCaseItem);

        if (result === false) {
            throw new TransformError(
                `Cannot create enumeration case \`${caseName}\`; another ` +
                `item already exists in this scope with that name.`,
                node, e.DUPLICATE_DECLARATION
            );
        }

        enumReference.staticCases.push(enumCaseItem);
        node.reference = enumCaseItem;
    }
}
