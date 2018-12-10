import ConstraintType from '../constraintType';
import TypeConstraint from '../typeConstraint';
import TypeCandidate from '../typeCandidate';
import TypeResolver from '../typeResolver';

import ScopeTupleItem from '../../scope/items/scopeTupleItem';
import ScopeForm from '../../scope/scopeForm';

import e from '../../errors';

/**
 * Resolves tuples.
 */
export default class TupleResolver extends TypeResolver {

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
        // Tuple params
        const parameters = this.node.expressions;

        // Get requested resolution constraint
        const requestedType = negotiate(ConstraintType.RequestedTypeResolutionConstraint)?.candidate.resolved();

        // If a definite deduction is expected
        const simplifyToPrecType = negotiate(ConstraintType.SimplifyToPrecType);

        // If at least one type is expected
        const requireType = negotiate(ConstraintType.RequireType);

        const hasDuplicateName = parameters
            .map(param => param.name.value)
            .filter((paramName, index, array) => array.indexOf(paramName) < index);

        if (hasDuplicateName.length) {
            this.emit(
                `Tuple has duplicate label \`${hasDuplicateName[0]}\`.`,
                e.TUPLE_DUPLICATE_LABEL
            );
        }

        if (requestedType) {
            if (!(requestedType instanceof ScopeTupleItem)) {
                if (requireType) {
                    this.emit(
                        `Tuple in this context would need to be ${requestedType} ` +
                        `which is not a tuple`,
                        e.NO_VALID_TYPE
                    );
                } else {
                    return [];
                }
            }

            // Check if same type signature.
            if (requestedType.parameters.length !== parameters.length) {
                if (requireType) {
                    this.emit(
                        `Tuple in this context would need to resolve to ${requestedType} ` +
                        `which has ${requestedType.parameters.length} while this tuple has ` +
                        `${parameters.length}`,
                        e.NO_VALID_TYPE
                    );
                } else {
                    return [];
                }
            }

            // Check if all the names are same
            const allNamesAreSame = parameters
                .map(parameter => parameter.name.value)
                .every((paramName, index) => paramName === requestedType.parameters[index].name);

            if (!allNamesAreSame) {
                if (requireType) {
                    this.emit(
                        `Tuple in this context would need to resolve ${requestedType} `,
                        `but the labels do not match.`,
                        e.NO_VALID_TYPE
                    );
                } else {
                    return [];
                }
            }

            // Check types
            for (let i = 0; i < parameters.length; i++) {
                const parameter = parameters[i];

                const paramTypes = this.getChild(parameter.value).resolve((type) => {
                    switch (type) {
                        // Pass the type from the type
                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return new TypeCandidate(requestedType.parameters[i].type)

                        // Should definetly resolve to one candidate because
                        // we have constraitn
                        case ConstraintType.SimplifyToPrecType:
                        case ConstraintType.RequireType:
                            return true;

                        // Cannot be void
                        case ConstraintType.VoidableContext: return false;

                        default: return negotiate(type);
                    }
                });

                // If they are no valid types for this param then this requested
                // type res constraint simply doesn't work.
                if (paramTypes.length === 0) {
                    if (requireType) {
                        this.emit(
                            `Parameter at index ${i + 1} in this tuple ` +
                            `could not resolve to any valid value.`,
                            e.NO_VALID_TYPE
                        );
                    } else {
                        return [];
                    }
                }

                // This shouldn't happen because the children should handle it
                // but still.
                if (paramTypes.length > 1) {
                    if (requireType) {
                        this.emit(
                            `Ambiguous deduction for the parameter at index ` +
                            `${i + 1} in this tuple.`,
                            e.AMBIGUOUS_EXPRESSION
                        );
                    } else {
                        // Otherwise this tuple doesn't work.
                        return [];
                    }
                }
            }

            this.node.reference = requestedType;
            return [new TypeCandidate(requestedType)];
        } else {

            const tupleParams = [];

            for (let i = 0; i < parameters.length; i++) {
                // Otherwise deduct all params.
                const paramTypes = this.getChild(parameter.value).resolve((type) => {
                    switch (type) {
                        // Pass the type from the type
                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return null;

                        // Should definetly resolve to one candidate because
                        // we have constraitn
                        case ConstraintType.SimplifyToPrecType:
                        case ConstraintType.RequireType:
                            return true;

                        // Cannot be void
                        case ConstraintType.VoidableContext: return false;

                        default: return negotiate(type);
                    }
                });

                // If they are no valid types for this param then this requested
                // type res constraint simply doesn't work.
                if (paramTypes.length === 0) {
                    if (requireType) {
                        this.emit(
                            `Parameter at index ${i + 1} in this tuple ` +
                            `could not resolve to any valid value.`,
                            e.NO_VALID_TYPE
                        );
                    } else {
                        return [];
                    }
                }

                // This shouldn't happen because the children should handle it
                // but still.
                if (paramTypes.length > 1) {
                    if (requireType) {
                        this.emit(
                            `Ambiguous deduction for the parameter at index ` +
                            `${i + 1} in this tuple.`,
                            e.AMBIGUOUS_EXPRESSION
                        );
                    } else {
                        // Otherwise this tuple doesn't work.
                        return [];
                    }
                }

                this.tupleParams.push({
                    type: paramTypes[0],
                    name: parameters[i].name.value,
                    sourec: parameters[i]
                });
            }

            this.node.reference = new ScopeTupleItem(
                ScopeForm.definite,
                this.node.toString(),
                {
                    parameters: tupleParams,
                    source: this.node
                }
            );

            return this.node.reference;
        }
    }
}
