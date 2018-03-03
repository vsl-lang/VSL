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
    isValidNode(node) { return !(node instanceof t.FieldStatement); }

    modify(node: Node, tool: ASTTool) {
        if (!this.isValidNode(node)) return;

        let scope = tool.scope;
        let requestedType = null,
            requestedTypeCandidate = null;

        if (!node.name.type && !node.value) {
            throw new TransformError(
                `If assignment does not have value it must have type explicitly ` +
                `specified.`,
                node
            );
        }

        // If we have an expected type (e.g. let a: T) then this passes T.
        if (node.name.type) {
            requestedType = new TypeLookup(node.name.type, vslGetTypeChild).resolve(scope);
            requestedTypeCandidate = new TypeCandidate(requestedType);
        }

        let resolvedType;
        if (node.value) {
            resolvedType = new RootResolver(node.value, vslGetChild, tool.context)
                .resolve((constraint) => {
                    switch (constraint) {
                        case ConstraintType.RequestedTypeResolutionConstraint:
                            return requestedTypeCandidate;
                        default:
                            return null;
                    }
                });
        } else {
            resolvedType = requestedType;
        }

        // Add assignment to scope.
        let aliasItem = new ScopeAliasItem(
            ScopeForm.definite,
            node.name.identifier.value,
            {
                type: resolvedType,
                source: node
            }
        );

        let result = scope.set(aliasItem);
        if (result === false) {
            throw new TransformError(
                `Attempted to create variable/field with name that already ` +
                `exists in this scope.`,
                node
            );
        }
    }
}

/**
 * if (expression === null && variableType === null) {
     // TODO: TAG
     throw new TransformError(
         `Variable \`${variableName}\` is declared without a type or ` +
         `a value. Provide at least one as the type cannot be ` +
         `deducted without an expression.`,
         node
     );
 }

 if (result === false) {
     throw new TransformError(
         `Redeclaration of variable \`${variableName}\` in scope. Did ` +
         `you mean to use the assignment operator (\`=\`)?`,
         node.name.identifier,
         e.DUPLICATE_DECLARATION
     );
 }
 */
