import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeMetaClassItem from '../../../scope/items/scopeMetaClassItem';
import ScopeAliasItem from '../../../scope/items/scopeAliasItem';
import LValueRef from '../LValueRef';

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
                `Item ${node.value} has ambigious reference in this context.`,
                node
            );
        } else {
            // If ScopeTypeItem then we have metaclass
            if (node.reference instanceof ScopeTypeItem) {
                // This means we have a static class. We will return the
                // @static.Goat { field1, field2, field3 } obj which is globally
                // init'd.
                // This is encountered in static props e.g. Cls.shared
                // In this case generate the referenced class
                const source = node.reference.source;
                const newCtx = context.bare();
                regen(source.relativeName, source.parentNode, newCtx);
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
                // identifier
                const typeSource = node.reference.type.source;
                if (typeSource) {
                    regen(typeSource.relativeName, typeSource.parentNode, context.bare());
                }

                // Otherwise we're referring to local variable
                if (asLValue) {
                    return new LValueRef({ property: node.reference.backendRef });
                } else {
                    return node.reference.backendRef.generate(context);
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
