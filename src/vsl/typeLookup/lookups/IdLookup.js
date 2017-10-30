import TypeLookup from '../typeLookup';
import ScopeTypeItem from '../../scope/items/scopeTypeItem';
import ScopeForm from '../../scope/scopeForm';

/**
 * Looks up a type in a scope. e.g. `A` in `parentScope` or for `A.B`, `B` in A.
 */
export default class IdLookup extends TypeLookup {
    /**
     * Resolves the next child
     * @param {Scope} scope - scope to resolve within
     * @return {ScopeTypeItem} located item
     * @throws {TypeLookupError} caught and reused to generate more detailed
     *                           info.
     */
    resolve(scope) {
        let name = this.node.value;
        let result = scope.get(new ScopeTypeItem(ScopeForm.query, name));
        
        if (result === null) {
            this.emit(
                `There is no type with name \`${name}\` in this scope. Check ` +
                `for typos or if this type declared.`
            )
        } else {
            return result;
        }
    }
}
