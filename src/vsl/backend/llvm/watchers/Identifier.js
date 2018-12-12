import BackendWatcher from '../../BackendWatcher';
import BackendError from '../../BackendError';
import t from '../../../parser/nodes';

import { Key } from '../LLVMContext';

import ScopeTypeItem from '../../../scope/items/scopeTypeItem';
import ScopeMetaClassItem from '../../../scope/items/scopeMetaClassItem';
import ScopeAliasItem from '../../../scope/items/scopeAliasItem';

import * as llvm from 'llvm-node';

export default class LLVMIdentifier extends BackendWatcher {
    match(type) {
        return type instanceof t.Identifier;
    }

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
                const source = node.reference.source;
                const newCtx = context.bare();
                return regen(source.relativeName, source.parentNode, newCtx);
            } else if (node.reference instanceof ScopeMetaClassItem) {
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

                return void 0;
            } else if (node.reference instanceof ScopeAliasItem) {
                const source = node.reference.source;

                if (!node.reference.backendRef) {
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

                // Otherwise we're referring to local variable
                if (asLValue) {
                    return node.reference.backendRef;
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
