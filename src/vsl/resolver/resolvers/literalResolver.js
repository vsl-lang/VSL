import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

// import STL from '../../stl/stl';

import VSLTokenType from '../../parser/vsltokentype.js';

/**
 * Resolves any atomic literal described by an `Literal` token class.
 */
export default class LiteralResolver extends TypeResolver {

    /**
     * @param {Node} node - The node to resolve.
     * @param {function(from: Node): TypeResolver} getChild - Takes a node and
     *     returns the resolver to execute, it is reccomended to just use a
     *     `switch` statement with `from.constructor` and then use that. It is
     *     fine to throw if the node is unhandled.
     */
    constructor(
        node: Node,
        getChild: (Node) => TypeResolver
    ) {
        super(node, getChild);
    }

    /**
     * Resolves types for a given node.
     *
     * @param {function(offer: ConstraintType): ?TypeConstraint} negotiate - The
     *     function which will handle or reject all negotiation requests. Use
     *     `{ nil }` to reject all offers (bad idea though).
     */

    resolve(negotiate: (ConstraintType) => ?TypeConstraint): void {
        // Get context for primitive resolution
        const context = negotiate(ConstraintType.TransformationContext).primitives;

        // Check the requested types of this ID
        const response = negotiate(ConstraintType.RequestedTypeResolutionConstraint);

        let literalTypeContext = null;
        // Specify default types for the candidates
        // Perhaps in the future a STL item would have to register or request
        // to be a default candidate but for now they are hardcoded here
        switch (this.node.type) {
            case VSLTokenType.Integer:
                literalTypeContext = context.get("Integer");
                break;

            case VSLTokenType.Decimal:
                literalTypeContext = context.get("FloatingPoint");
                break;

            case VSLTokenType.String:
                literalTypeContext = context.get("String");
                break;

            case VSLTokenType.ByteSequence:
                literalTypeContext = context.get("ByteSequence");
                break;

            case VSLTokenType.Boolean:
                literalTypeContext = context.get("Boolean");
                break;

            case VSLTokenType.Regex:
                literalTypeContext = context.get("Regex");
                break;

            default: throw new TypeError(`Undeducatble literal of type ${this.node.type}`);
        }

        // Make sure there is a type context that is valid and all
        if (!literalTypeContext || literalTypeContext.types.length <= 0) {
            this.emit(
                `Literal has no overlapping type candidates.\n` +
                `They are a few reasons this could happen: \n` +
                `  1. The STL is not linked\n` +
                `  2. You are using a literal which doesn't have a class ` +
                `associated with it.\n` +
                `This is likely an internal bug, but check for an existing\n` +
                `report before leaving your own. You can also try to define\n` +
                `your own candidate using \`@primitive(...)\``
            );
        }

        let { types: typeList, precType } = literalTypeContext;

        // Create TypeCandidate list for the literal.
        // This is not yet intersected with the requested resolutions
        let typeCandidates = typeList
            .map(
                candidate =>
                    new TypeCandidate(candidate, precType === candidate)
            );

        // Match literal type to context-based candidates
        if (response !== null) {
            // Actual type intersect
            this.mutableIntersect([response], typeCandidates)
        }

        // Okay if this is 0 that means you have conflicting things
        // This is because errors have already been thrown for no actually
        // type candidates.
        if (typeCandidates.length === 0) {
            this.emit(
                `This literal would need to be a type which it cannot be in\n` +
                `order for everything to work. Candidates would include: \n\n` +
                typeList.map(i => "    • " + i.toString()).join("\n") +
                `\n\nHowever none of these are actually a type this literal could\n` +
                `represent.`
            );
        }

        if (typeCandidates.length === 1) {
            this.node.typeRef = typeCandidates[0].candidate;
        }

        return typeCandidates;
    }
}
