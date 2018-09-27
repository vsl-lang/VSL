import ScopeMetaClassItem from './scopeMetaClassItem';

/**
 * Refers to a specific instance of a generic type
 */
export default class GenericInstance extends ScopeMetaClassItem {
     /**
      * Creates a generic type. This is like ScopeTypeItem except that it also
      * stores the generic parents.
      *
      * @param {ScopeForm} form - The form or type of the scope item.
      * @param {Object} data - Information about the class
      * @param {ScopeTypeItem} data.base - The base class (`A.B` in `A.B<T, U>`)
      * @param {ScopeTypeItem[]} data.parameters - The params, expected to be
      *                                          valid.
      */
     constructor(data) {
         super(data);

         /** @type {ScopeTypeItem[]} */
         this.parameters;
     }

     /** @protected */
     init({ base, parameters, ...options }) {
        super.init({
            referencingClass: base,
            ...options
        });

        this.parameters = parameters;
    }

     /** @return {string} */
    toString() {
        return `${this.base}<${this.parameters.join(', ')}>`;
    }
 }
