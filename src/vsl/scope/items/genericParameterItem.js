import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';
import Scope from '../scope';

/**
 * Represents a generic parameter in a class. This cannot resolve to a type.
 * Instead you must contextually determine this value through negotiation.
 */
export default class GenericParameterItem extends ScopeTypeItem {

    /**
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @protected */
    init({ item, ...opts }) {
        super.init({
            interfaces: [],
            staticScope: new Scope(),
            subscope: new Scope(),
            ...opts
        });
    }

    /** @override */
    contextualType(typeContext) {
        const instanceType = typeContext.getTypeForGenericParameter(this);
        if (instanceType === null) {
            return this;
        }

        return instanceType;
    }

    /** @return {string} */
    toString() {
        return `${this.rootId}`;
    }

    /**
     * Returns human-readable description of type.
     * @type {string}
     * @override
     */
    get typeDescription() { return 'Generic Parameter'; }

    /** @override */
    clone(opts) {
        super.clone({
            ...opts
        });
    }
}
