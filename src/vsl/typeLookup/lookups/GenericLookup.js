import TypeLookup from '../typeLookup';
import ScopeGenericItem from '../../scope/items/scopeGenericItem';
import ScopeForm from '../../scope/scopeForm';

const util = require('util')

/**
 * Locates and resolves a generic. Returns a ``
 */
export default class GenericLookup extends TypeLookup {
    /**
     * Resolves the next child
     * @param {Scope} scope - scope to resolve within
     * @return {ScopeTypeItem} located item
     * @throws {TypeLookupError} caught and reused to generate more detailed
     *                           info.
     */
    resolve(scope) {
        // Generic value should be a ID so we'll get the .value
        let name = this.node.head.value;

        // First resolve sub-things.
        // These are the parameters e.g. in A<T, U> these are T, U
        // We must resolve these first to ScopeItems.
        let parameters = this.node.parameters.map(
            param => this.getChild(param).resolve(scope)
        );

        // Now we'll (try to) get the template. I.e. locate the generic.
        let result = scope.get(new ScopeGenericItem(ScopeForm.query, name))?.resolved();

        // Ensure the generic exists
        if (!result) {
            this.emit(
                `There is no generic type with name \`${name}\` in this scope. Check ` +
                `for typos or if this type declared in the current scope. If ` +
                `this is a module, check you are using the right version and ` +
                `it is imported properly.`
            )
        }

        // Check the correct amount of parameters were provided.
        if (this.node.parameters.length !== result.genericParents.length) {
            this.emit(
                `Incorect amount of parameters for ${result}. This takes ` +
                `${result.genericParents.length} generic parameters but you ` +
                `provided ${this.node.parameters.length}.`
            )
        }

        // Check the parameters match the correct types.
        parameters.forEach((param, i) => {
            // We'll check if the parameter (already resolved) is castable to
            //  the respective generic parameter. e.g. in:
            //    class A<T: U> { ... }
            //    let a: A<B> we'll check if `B is U`
            // This means at this time result.genericParents[i] should be
            //  resolved.
            if (!param.castableTo(result.genericParents[i])) {
                this.emit(
                    `Generic parameter needed to be of ` +
                    `${result.genericParents[i]}. However ${param} was ` +
                    `passed instead. Ensure ${param} is either implements or ` +
                    `inherits ${result.genericParents[i]}.`,
                    this.node.parameters[i]
                );
            }
        })

        return result.usedWith(parameters);
    }
}
