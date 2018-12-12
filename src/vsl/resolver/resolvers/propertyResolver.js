import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';
import ScopeMetaClassItem from '../../scope/items/scopeMetaClassItem';

import e from '../../errors';

/**
 * Resolves `PropertyExpression`s. Will obtain LHS's type and do a `subscope`
 * lookup. Delegates to `IdResolver` however the scope is the subscope as
 * mentioned before.
 */
export default class PropertyResolver extends TypeResolver {

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
        // We do properties in two steps:
        //  1. Find candidates for LHS
        //  2. Set subscope to LHS.Type
        //  3. Match with RHS using Identifier

        const head = this.node.head;

        // Call to resolve head
        const tailResolver = this.getChild(this.node.tail);

        // If a definite deduction is expected
        const simplifyToPrecType = negotiate(ConstraintType.SimplifyToPrecType);

        // If a definite deduction is expected
        const requireType = negotiate(ConstraintType.RequireType);

        // If the result of this expression is being called.
        const isCallee = negotiate(ConstraintType.BoundedFunctionContext);

        // The candidates of the head
        const candidates = this.getChild(head).resolve((type) => {
            switch (type) {
                case ConstraintType.RequestedTypeResolutionConstraint:
                    return null;
                case ConstraintType.BoundedFunctionContext:
                    return false;
                case ConstraintType.VoidableContext:
                    return false;
                default: return negotiate(type);
            }
        });

        if (requireType && candidates.length === 0) {
            this.emit(
                `Left-hand side of property could not be resolved.`,
                e.NO_VALID_TYPE
            );
        }

        // Stores a respective list of candidates in form
        //  Map<headType: TypeCandidate, fields[]>
        let candidateList = new Map();

        // If one of the heads is prec type
        let hasPrecType = false;

        // Try IdResolver for each candidate.
        for (let i = 0; i < candidates.length; i++) {;
            const candidate = candidates[i].candidate;

            // Here we will attempt to find if the property exists
            let matchingFields = tailResolver.resolve((type) => {
                switch (type) {
                    case ConstraintType.TypeScope:
                        return candidate.subscope;

                    case ConstraintType.TypeContext:
                        return candidate.getTypeContext();

                    case ConstraintType.RequireType:
                        return false;

                    default: return negotiate(type);
                }
            });

            const possibleFieldTypes = matchingFields.map(matchingField => ({
                tailReference: this.node.tail.reference,
                tailType: matchingField,
                headIsPrecType: candidates[i].precType
            }));

            if (candidates[i].precType) hasPrecType = true;

            if (possibleFieldTypes.length === 0) continue;
            candidateList.set(candidates[i], possibleFieldTypes);
        }

        // Simplify prec type if applicable.
        if (candidateList.size > 1 && hasPrecType) {
            // Go through heads
            for (const [headCandidate, _] of candidateList) {
                // Remove non-prec head
                if (!headCandidate.precType) {
                    candidateList.delete(headCandidate);
                }
            }

            // If we have now simplfied then re-resolve head
            if (candidateList.size === 1) {
                this.getChild(head).resolve((type) => {
                    switch (type) {
                        case ConstraintType.RequestedTypeResolutionConstraint:
                            const [ headCandidate ] = [...candidateList][0];
                            return headCandidate;
                        case ConstraintType.SimplifyToPrecType:
                            return true;
                        case ConstraintType.BoundedFunctionContext:
                            return false;
                        case ConstraintType.VoidableContext:
                            return false;
                        default: return negotiate(type);
                    }
                });
            }
        }

        if (candidateList.size > 1) {
            // Since in this case LHS is ambiguous, we'll try to resolve LHS
            // forcing it to deduct and if it fails then we'll throw our fallback
            // error. This provides more informative errors.
            this.getChild(head).resolve((type) => {
                switch (type) {
                    case ConstraintType.RequestedTypeResolutionConstraint:
                        return null;
                    case ConstraintType.SimplifyToPrecType:
                        return true;
                    case ConstraintType.BoundedFunctionContext:
                        return false;
                    case ConstraintType.VoidableContext:
                        return false;
                    default: return negotiate(type);
                }
            });

            this.emit(
                `Left-hand side of property is ambiguous. Report this error.`,
                e.AMBIGUOUS_EXPRESSION
            );
        } else if (candidateList.size === 0) {
            if (requireType) {
                if (isCallee) {
                    this.emit(
                        `Left-hand side of expression does not have method named ` +
                        `\`${this.node.tail.value}\`.`,
                        e.METHOD_DOES_NOT_EXIST
                    );
                } else {
                    this.emit(
                        `Left-hand side of expression does not have property named ` +
                        `\`${this.node.tail.value}\`.`,
                        e.PROPERTY_DOES_NOT_EXIST
                    );
                }
            } else {
                return [];
            }
        }

        const [{ candidate: headType }, tailTypes]  = [...candidateList][0];

        // If it is call we'll pass the generic of LHS to the function
        if (isCallee) {
            if (headType instanceof ScopeMetaClassItem) {
                this.negotiateUpward(ConstraintType.TypeContext, headType.referencingClass.getTypeContext());
            } else {
                this.negotiateUpward(ConstraintType.TypeContext, headType.getTypeContext());
            }
        }

        this.node.baseRef = headType;

        if (tailTypes.length > 1) {
            if (!isCallee) {
                this.emit(
                    `Left-hand side of expression has multiple properties named ` +
                    `\`${this.node.tail.value}\`. This should't be possible, ` +
                    `report this error.`,
                    e.AMBIGUOUS_EXPRESSION
                );
            } else {
                // If we are here then we'll just return all and the parent should specialize.
            }
        } else if (tailTypes.length === 1) {
            this.node.propertyRef = tailTypes[0].tailReference;
        } else {
            // This should never be reached because we ensure no length < 1 is
            // passed.
            this.emit(
                `Internal error: the definite head type has no tail types.`
            );
        }

        // TODO: handle these
        return tailTypes.map(type => type.tailType);
    }
}
