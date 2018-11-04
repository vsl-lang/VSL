import TypeLookup from '../typeLookup';
import ScopeGenericSpecialization from '../../scope/items/scopeGenericSpecialization';
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
        let head = this.node.head;

        // First resolve sub-things.
        // These are the parameters e.g. in A<T, U> these are T, U
        // We must resolve these first to ScopeItems.
        let parameters = this.node.parameters.map(
            param => this.getChild(param).resolve(scope)
        );

        // Now we'll (try to) get the generic class. In A.B<T, U> this is A.B
        let genericClass = this.getChild(head).resolve(scope, { allowGenerics: true });

        // Ensure the generic exists
        if (!genericClass) {
            this.emit(
                `There is no generic type with name \`${name}\` in this scope. Check ` +
                `for typos or if this type declared in the current scope. If ` +
                `this is a module, check you are using the right version and ` +
                `it is imported properly.`
            )
        }

        // Ensure the class is a generic
        if (!genericClass.isGeneric) {
            this.emit(
                `The class ${name} is specialized however it is not a generic.`
            );
        }

        // Check the correct amount of parameters were provided.
        if (parameters.length !== genericClass.genericInfo.parameters.length) {
            this.emit(
                `Incorect amount of parameters for ${genericClass}. This ` +
                `takes ${genericClass.genericInfo.parameters.length} generic ` +
                `parameters but you provided ${parameters.length}.`
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

            // // TODO: Generic limit types
            // if (!param.castableTo(genericClass.genericInfo.parameters[i])) {
            //     this.emit(
            //         `Generic parameter needed to be of ` +
            //         `${result.genericParents[i]}. However ${param} was ` +
            //         `passed instead. Ensure ${param} is either implements or ` +
            //         `inherits ${result.genericParents[i]}.`,
            //         this.node.parameters[i]
            //     );
            // }
        });

        return new ScopeGenericSpecialization(ScopeForm.definite, `${genericClass}<${parameters.join(", ")}>`, {
            genericClass: genericClass,
            parameters: parameters
        });
    }
}
