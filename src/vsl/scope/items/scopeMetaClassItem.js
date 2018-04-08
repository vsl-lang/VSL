import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';
import Scope from '../Scope';

/**
 * Represents a metaclass by mocking/redirecting the subscope.s
 */
export default class ScopeMetaClassItem extends ScopeTypeItem {
    /**
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     */
    constructor(options) {
        super(ScopeForm.definite, 'MetaClass', options);

        /** @type {ScopeTypeItem} */
        this.referencingClass;
    }

    /** @protected */
    init({
        referencingClass, ...options
    } = {}) {
        super.init({
            subscope: referencingClass.staticScope,
            staticScope: new Scope(),
            ...options
        });

        this.referencingClass = referencingClass;
    }

    /** @override */
    clone(opts) {
        super.clone({
            referencingClass: this.referencingClass,
            ...opts
        });
    }

    /**
     * Returns a query for the current {@link ScopeItem}
     * @return {ScopeItem} of type Query.
     */
    getQuery() {
        return new (this.constructor)({});
    }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `vsl.MetaClass.${this.referencingClass.uniqueName}`
    }

    /** @return {string} */
    toString() {
        return `MetaClass<<${this.referencingClass}>>`
    }
}
