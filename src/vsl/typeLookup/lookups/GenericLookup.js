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
        let name = this.node.type.value;
        
        // First resolve sub-things.
        let parameters = this.node.parameters.map(
            param => this.getChild(param).resolve(scope)
        );
        
        let result = scope.get(new ScopeGenericItem(ScopeForm.query, name))?.resolved();
        
        if (result === null) {
            this.emit(
                `There is no type with name \`${name}\` in this scope. Check ` +
                `for typos or if this type declared in the current scope. If ` +
                `this is a module, check you are using the right version and ` +
                `it is imported properly.`
            )
        }
        
        if (this.node.parameters.length !== result.genericParents.length) {
            this.emit(
                `Incorect amount of parameters for ${result}. This takes ` +
                `${result.genericParents.length} generic parameters but you ` +
                `provided ${this.node.parameters.length}.`
            )
        }
        
        parameters.forEach((param, i) => {
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
        
        result.usedWith(parameters);
        return result;
    }
}
