import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

import ScopeAliasItem from '../../scope/items/scopeAliasItem';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeForm from '../../scope/scopeForm';

import TypeLookup from '../../typeLookup/typeLookup';
import vslGetTypeChild from '../../typeLookup/vslGetTypeChild';

import e from '../../errors';

/**
 * Type deducts basic assignment statements
 *
 * @example
 * var a: T = b
 */
export default class TypeDeductAssignment extends Transformation {
    constructor() {
        super(t.AssignmentStatement, "TypeDeduct::AssignmentStatement");
    }

    /**
     * Determines if should specifically run for this node.
     * @param {Node} node Node should test for
     * @return {boolean} if the node should be run
     */
    isValidNode(node) {
        return !(node instanceof t.FieldStatement || node.parentScope.rootScope);
    }

    modify(node: Node, tool: ASTTool) {
        // Do NOT run for global or field
        if (!this.isValidNode(node)) return;

        const scope = tool.scope;
        const assignmentScope = tool.assignmentScope;
        let requestedType = null,
            requestedTypeCandidate = null;

        if (!node.name.type && !(node.value instanceof t.ExpressionStatement)) {
            throw new TransformError(
                `If assignment does not have value it must have type explicitly ` +
                `specified.`,
                node,
                e.ASSIGNMENT_TYPE_REQUIRED
            );
        }

        if (tool.isStatic && !node.value) {
            throw new TransformError(
                `Static field must have declared value.`,
                node,
                e.ASSIGNMENT_VALUE_REQUIRED
            );
        }

        // If we have an expected type (e.g. let a: T) then this passes T.
        if (node.name.type) {
            requestedType = new TypeLookup(node.name.type, vslGetTypeChild).resolve(scope);
            requestedTypeCandidate = new TypeCandidate(requestedType);
        }

        let resolvedType;
        if (node.value instanceof t.ExpressionStatement) {
            let typeCandidates = new RootResolver(node.value, vslGetChild, tool.context)
                .resolve((constraint) => {
                    switch (constraint) {
                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return requestedTypeCandidate;
                        case ConstraintType.SimplifyToPrecType:
                            return true;
                        default:
                            return null;
                    }
                });

            // We can safely take the first type because of SimplifyToPrecType
            // which ensures that we don't have ambiguity.
            resolvedType = typeCandidates[0].candidate;
        } else {
            resolvedType = requestedType;
        }

        // Add assignment to scope.
        let aliasItem = new ScopeAliasItem(
            ScopeForm.definite,
            node.name.identifier.value,
            {
                type: resolvedType,
                source: node,
                isStatic: tool.isStatic,
                isScopeRestricted: tool.isPrivate
            }
        );

        node.reference = aliasItem;
        let result = assignmentScope.set(aliasItem);
        if (result === false) {
            throw new TransformError(
                `Attempted to create variable/field with name that already ` +
                `exists in this scope.`,
                node,
                e.DUPLICATE_DECLARATION
            );
        }
    }
}
