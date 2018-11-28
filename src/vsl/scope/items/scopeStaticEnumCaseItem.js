import ScopeAliasItem from './scopeAliasItem';

/**
 * This references an alias that is from a function arg.
 */
export default class ScopeStaticEnumCaseItem extends ScopeAliasItem {

    /**
     * @param {Object} opts - see the parent class for more opts
     * @param {number} opts.caseIndex - index of this enum case.
     * @override
     */
    init({ caseIndex, ...opts }) {
        super.init(opts);

        /**
         * The index of the case relative to others starting at zero.
         * @type {number}
         */
        this.caseIndex = caseIndex;
    }

}
