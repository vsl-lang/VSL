import Transformation from '../transformation';
import TransformError from '../transformError';
import e from '../../errors';
import t from '../../parser/nodes';

import ScopeItem from '../../scope/scopeItem';

/**
 * Registers the @deprecated annotation.
 */
export default class DescribeDeprecatedAnnotation extends Transformation {
    constructor() {
        super(t.Annotation, "Describe::DeprecatedAnnotation");
    }

    modify(node: Node, tool: ASTTool) {

        if (node.name !== "deprecated") return;

        const parentNode = tool.nthParent(2);
        const targetedDeclaration = parentNode.reference;
        if (targetedDeclaration instanceof ScopeItem) {

            const targetedDeclarationType = targetedDeclaration.typeDescription;
            const targetedDeclarationName = targetedDeclaration.rootId;

            const deprecationText = node.args?.length === 1 ?
                node.args[0] :
                `${targetedDeclarationType} ${targetedDeclarationName} is deprecated. ` +
                `It's use is not recommended as it will likely be removed in a future release.`;

            targetedDeclaration.deprecationStatus = deprecationText;

        } else {
            throw new TransformError(
                `Unexpected @deprecated. The @deprecated can only be used on ` +
                `declarations.`,
                node
            );
        }

    }
}
