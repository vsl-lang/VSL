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

    modify(node: Node, tool: ASTTool) {
        let scope = tool.scope;
        let requestedType = null;

        // If we have an expected type (e.g. let a: T) then this passes T.
        if (node.name.type) {
            requestedType = new TypeCandidate(
                new TypeLookup(node.name.type, vslGetTypeChild).resolve(scope)
            );
        }

        if (node.value) {
            let resolver = new RootResolver(node.value, vslGetChild, tool.context)
                .resolve((constraint) => {
                    if (constraint === ConstraintType.RequestedTypeResolutionConstraint) {
                        return requestedType;
                    } else {
                        return null;
                    }
                });
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
