import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeMetaClassItem from '../../../scope/items/scopeMetaClassItem';
import ScopeAliasItem from '../../../scope/items/scopeAliasItem';
import LValueRef from '../LValueRef';
import ValueRef from '../ValueRef';

import TypeContext from '../../../scope/TypeContext';

import * as llvm from 'llvm-node';

export default class LLVMIdentifier extends BackendWatcher {
    /** @override */
    match(type) {
        return type instanceof t.Identifier;
    }

    /** @override */
    receive(node, tool, regen, context) {
        const backend = context.backend;

        const asLValue = context.popValue(Key.LValueContext);

        if (node.reference === null) {
            throw new BackendError(
                `Identifier \`${node.value}\` has ambiguous reference in this context.`,
                node
            );
        } else {
            // If ScopeTypeItem then we have metaclass
            if (node.reference instanceof ScopeTypeItem) {
                // This means we have a static class. We will return the
                // @static.Goat { field1, field2, field3 } obj which is globally
                // init'd.
                //
                // Don't really need to do much here since property expression
                // will generate static fields if needed.

                return;
            } else if (node.reference instanceof ScopeMetaClassItem) {
                // No idea why this would be called TODO: figure this out
                // Here we're referring to metatype

                // If it exists, we'll generate that class.
                const source = node.reference.referencingClass.source;
                regen(source.relativeName, source.parentNode, context.bare());

                // The next item should be property (i.e. accessing static var)
                // This shouldn't be called in static methods because that doesn't
                // gen the head.

                if (!(node.parentNode instanceof t.PropertyExpression)) {
                    backend.warn(
                        `MetaType expression cannot be used outside of referencing ` +
                        `a static member.`,
                        node
                    );
                }
            } else if (node.reference instanceof ScopeAliasItem) {
                // Typical local variable case
                const source = node.reference.source;

                // If the identifier doesn't have an LLVM value by the time it
                // is inspected either 1) it is global var 2) it is used before
                // decld
                if (!node.reference.backendRef) {
                    // If the source doesn't have backend ref
                    if (!source.isGlobal) {
                        throw new BackendError(
                            `Used identifier before declaration \`${node.reference}\`.`,
                            node
                        );
                    } else {
                        // The only reason it wouldn't have already been gen is if it
                        // is global and seen after so we do that here.
                        regen(source.relativeName, source.parentNode, context.bare());
                    }
                }


                // Also what we want to do is generate the class of the
                // identifier.
                //
                // GLOABL_VAR => Compile 'GLOBAL_VAR'
                // const typeSource = node.reference.source;
                // if (typeSource) {
                //     regen(typeSource.relativeName, typeSource.parentNode, context.bare());
                // }

                // global vars can't have generics
                // console.log(node.reference.type.toString());
                const variableReference = node.reference.backendRef;

                if (!(variableReference instanceof ValueRef)) {
                    const isGeneric = variableReference instanceof Map ? " (was generic)" : "";

                    throw new BackendError(
                        `Global variable was not compiled${isGeneric}.`,
                        node
                    );
                }

                // Otherwise we're referring to local variable
                if (asLValue) {
                    return new LValueRef({ property: variableReference });
                } else {
                    return variableReference.generate(context);
                }
            } else {
                throw new BackendError(
                    `Identifier has unknown compile value of ${node.reference && node.reference.constructor.name}`,
                    node
                );
            }
        }
    }
}
