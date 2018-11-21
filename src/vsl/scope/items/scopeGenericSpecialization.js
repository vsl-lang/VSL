import ScopeTypeItem from './scopeTypeItem';
import ScopeForm from '../scopeForm';
import TypeContext from '../TypeContext';

/**
 * Respresents a generic sepecialization. The generic class and the type parameter
 * values.
 */
export default class ScopeGenericSpecialization extends ScopeTypeItem {

    /**
     * Specializes the passed {@link ScopeTypeItem} with the passed parameters,
     * @param {ScopeTypeItem} genericClass
     * @param {ScopeTypeItem[]} parameters - The generic parameters
     * @return {ScopeGenericSpecialization}
     * @throws {TypeError} if an invalid number of parameters.
     */
    static specialize(genericClass, parameters) {
        const genericParameters = genericClass.genericInfo.parameters;
        const existingSpecializations = genericClass.genericInfo.existingSpecializations;

        if (genericParameters.length === 0) {
            throw new TypeError(
                `Attempted to specialize type \`${genericClass}\` which has no` +
                `parameters.`
            );
        }

        if (parameters.length !== genericParameters.length) {
            throw new TypeError(
                `Attempted to specialize type \`${genericClass}\` with invalid ` +
                `amount of parameters.`
            );
        }

        main:
        for (let i = 0; i < existingSpecializations.length; i++) {
            const [types, specializationInstance] = existingSpecializations[i];

            for (let j = 0; j < types.length; j++) {
                if (types[j] !== parameters[j]) {
                    continue main;
                }
            }

            return specializationInstance;
        }

        // We'll be here if there isn't an existing specialization
        const newSpecialization = new ScopeGenericSpecialization(
            ScopeForm.definite,
            `${genericClass}<${parameters.join(", ")}>`,
            {
                genericClass: genericClass,
                parameters: parameters
            }
        );

        existingSpecializations.push([parameters, newSpecialization]);
        return newSpecialization;
    }

    /**
     * PLEASE USE {@link ScopeGenericSpecialization.specialize} ELSE THERE WILL
     * BE CAST ERRORS.
     *
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

        // We'll pass similar params but do note that not ALL things are
        // propogated. For example `source`.
        super.init({
            interfaces: genericClass.interfaces,
            superclass: genericClass.superclass,
            isInterface: genericClass.isInterface,
            staticScope: genericClass.staticScope,
            subscope: genericClass.subscope,
            mockType: genericClass.mockType,
            defaultInitializer: genericClass.defaultInitializer
        });

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

    /** @override */
    resolve() {
        super.resolve();

        this.interfaces = this.genericClass.interfaces;
        this.superclass = this.genericClass.superclass;
        this.defaultInitializer = this.genericClass.defaultInitializer;
    }

    /**
     * Returns the type in a context. Can be used to resolve generic.
     * @param {TypeContext} typeContext
     * @return {ScopeTypeItem} may return a different class FYI.
     * @override
     */
    contextualType(typeContext) {
        let resolvedParameters = this.parameters.map(
            parameter =>
                parameter.contextualType(typeContext)
        );

        return ScopeGenericSpecialization.specialize(
            this.genericClass, resolvedParameters
        );
    }

    /**
     * Returns TypeContext for just this specialization.
     * @return {TypeContext}
     * @override
     */
    getTypeContext() {
        const genericParameters = this.genericClass.genericInfo.parameters;
        const specializationMap = new Map();

        for (let i = 0; i < genericParameters.length; i++) {
            specializationMap.set(genericParameters[i], this.parameters[i]);
        }

        return new TypeContext({ genericParameters: specializationMap })
    }

    /**
     * Returns unique name for scope item
     * @type {string}
     */
    get uniqueName() {
        return `${this.genericClass}${this.getTypeContext().getMangling()}`
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
