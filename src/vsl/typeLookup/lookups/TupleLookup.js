import TypeLookup from '../typeLookup';
import ScopeTupleItem from '../../scope/items/scopeTupleItem';
import ScopeForm from '../../scope/scopeForm';

/**
 * Locates and resolves a tuple. Same tuple types may return new objects.
 */
export default class TupleLookup extends TypeLookup {
    /**
     * Resolves the next child
     * @param {Scope} scope - scope to resolve within
     * @return {ScopeTypeItem} located item
     * @throws {TypeLookupError} caught and reused to generate more detailed
     *                           info.
     */
    resolve(scope) {
        // Generic value should be a ID so we'll get the .value
        const params = this.node
            .params
            .map(
                parameter => ({
                    name: parameter.name.value,
                    type: this.getChild(parameter.type).resolve(scope)
                })
            );

        const tupleItem = new ScopeTupleItem(
            ScopeForm.definite,
            this.node.toString(),
            {
                parameters: params,
                source: this.node
            }
        );

        return tupleItem;
    }
}
