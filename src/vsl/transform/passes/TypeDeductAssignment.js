import Transformation from '../transformation.js';
import TransformError from '../transformError.js';
import TokenType from '../../parser/vsltokentype';
import t from '../../parser/nodes';

import { RootResolver } from '../../resolver/resolvers/*';
import vslGetChild from '../../resolver/vslGetChild';
import ConstraintType from '../../resolver/constraintType';
import TypeCandidate from '../../resolver/typeCandidate';

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
        // let scope = tool.scope;
        //
        // let types = [];
        //
        // // If we have an expected type (e.g. let a: T) then this passes T.
        // if (node.name.type) {
        //     types.push(
        //         new TypeCandidate(
        //             new TypeLookup(node.name.type, vslGetTypeChild).resolve(scope)
        //         )
        //     );
        // }
        //
        // if (node.value) {
        //     let resolver = new RootResolver(node.value, vslGetChild, tool.context)
        //         .resolve((constraint) => {
        //             if (constraint === ConstraintType.RequestedTypeResolutionConstraint &&
        //                 types.length > 0) {
        //                 return types;
        //             } else {
        //                 return null;
        //             }
        //         });
        // }
    }
}
