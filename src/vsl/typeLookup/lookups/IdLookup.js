import TypeLookup from '../typeLookup';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeForm from '../../scope/scopeForm';

import e from '../../errors';

/**
 * Looks up a type in a scope. e.g. `A` in `parentScope` or for `A.B`, `B` in A.
 */
export default class IdLookup extends TypeLookup {
    /**
     * Resolves the next child
     * @param {Scope} scope - scope to resolve within
     * @param {Object} [opts={}] - Options
     * @param {boolean} [opts.allowGenerics=false] - If in context, a generic
     *                                             should be returnable.
     * @return {ScopeTypeItem} located item
     * @throws {TypeLookupError} caught and reused to generate more detailed
     *                           info.
     */
    resolve(scope, { allowGenerics = false } = {}) {
        let name = this.node.value;
        let result = scope.get(new ScopeTypeItem(ScopeForm.query, name, {}))?.resolved();

        if (!result) {
            this.emit(
                `There is no type with name \`${name}\` in this scope. Check ` +
                `for typos or if this type declared in the current scope. If ` +
                `this is a module, check you are using the right version and ` +
                `it is imported properly.`,
                this.node,
                e.UNDECLARED_IDENTIFIER
            );
        } else if (result.isGeneric && !allowGenerics) {
            this.emit(
                `The class \`${name}\` is a generic class. This means you ` +
                `must specify the generic types and parameters using ` +
                `\`${name}<...>\``,
                this.node,
                e.GENERIC_SPECIALIZATION_REQUIRED
            );
        }

        return result;
    }
}
