import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';

/**
 * Respresents a generic sepecialization. The generic class and the type parameter
 * values.
 */
export default class ScopeGenericSpecialization extends ScopeItem {

    /**
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     * @param {ScopeTypeItem} data.genericClass - Original generic class.
     * @param {ScopeTypeItem[]} data.parameters[] - Specialized generic parameters.
     *                                            ensure these match the genericInfo
     *                                            of the original class.
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @protected */
    init({ genericClass, parameters }) {
        /** @type {ScopeTypeItem} */
        this.genericClass = genericClass;

        /** @type {ScopeTypeItem[]} */
        this.parameters = parameters;
    }

    /** @return {string} */
    toString() {
        return `${this.genericClass}<${this.parameters.join(", ")}>`;
    }

    /** @override */
    clone(opts) {
        super.clone({ ...opts });
    }
}
