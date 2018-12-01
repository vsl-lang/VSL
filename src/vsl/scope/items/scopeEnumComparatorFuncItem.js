import ScopeFuncItem from './scopeFuncItem';
import ScopeForm from '../scopeForm';
import ScopeFuncItemArgument from './scopeFuncItemArgument';

/**
 * Comparator function operator for an enum.
 */
export default class ScopeEnumComparatorFuncItem extends ScopeFuncItem {

    /**
     * Creates an enumeration comparator DEPENDENT on the provided value.
     * @param {string} comparatorType - MUST be '==' or '!='
     * @param {ScopeTypeItem} selfType - The type of the enum
     * @param {ScopeTypeItem} booleanType - The boolean type from context.
     */
    constructor(comparatorType, selfType, booleanType) {
        super(ScopeForm.definite, comparatorType, {
            args: [
                new ScopeFuncItemArgument('lhs', selfType, false, null),
                new ScopeFuncItemArgument('rhs', selfType, false, null)
            ],
            returnType: booleanType,
            isInternalImplementation: true
        });

        /**
         * Comparator function should always be inlined.
         * @type {Boolean}
         */
        this.shouldInline = true;

        /**
         * This is the type of this comparator function. It is ALWAYS either
         * '==' or '!='
         * @type {string}
         */
        this.comparatorType = comparatorType;
    }

}
