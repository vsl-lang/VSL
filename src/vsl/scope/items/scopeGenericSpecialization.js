import ScopeItem from '../scopeItem';
import ScopeForm from '../scopeForm';
import TypeContext from '../TypeContext';

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
     * @throws {TypeError} if invalid amount of args
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /** @protected */
    init({ genericClass, parameters }) {
        if (!genericClass.isGeneric) {
            throw new TypeError(
                `Cannot specialize non-generic type \`${this.genericClass}\``
            );
        }

        if (parameters.length < genericClass.genericInfo.parameters.length) {
            throw new TypeError(
                `Attempted to specialize generic \`${this.genericClass}\` with invalid amount of specialization arguments.`
            );
        }

        /** @type {ScopeTypeItem} */
        this.genericClass = genericClass;

        /** @type {ScopeTypeItem[]} */
        this.parameters = parameters;
    }

    /**
     * Returns TypeContext for just this specialization.
     * @return {TypeContext}
     */
    getTypeContext() {
        const genericParameters = this.genericClass.genericInfo.parameters;
        const specializationMap = new Map();

        for (let i = 0; i < genericParameters.length; i++) {
            specializationMap.set(genericParameters[i], this.parameters[i]);
        }

        return new TypeContext({ genericParameters: genericParameters })
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
