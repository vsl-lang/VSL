import ScopeTypeItem from './scopeTypeItem';

/**
 * A scope item for an enum.
 */
export default class ScopeEnumItem extends ScopeTypeItem {

    /**
     * Creates an enumeration.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);

        /**
         * The static enumeration cases
         * @type {ScopeStaticEnumCaseItem}
         */
        this.staticCases = [];
    }

    /**
     * @param {Object} opts - see parent class for more info
     * @param {ScopeTypeItem} opts.backingType
     */
    init({ backingType, ...opts }) {
        super.init(opts);

        /**
         * The type that the enum internally represents/
         * @type {ScopeTypeItem}
         */
        this.backingType = backingType;
    }

}
