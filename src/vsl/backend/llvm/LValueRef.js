/**
 * References an LValue
 */
export default class LValueRef {
    /**
     * Creates an lvalue reference
     * @param {Object} data
     * @param {ValueRef} data.property - The main property to set
     * @param {?llvm.Value} [data.self=null] - If applicable the self value
     */
    constructor({ property, self }) {
        /**
         * Main property
         * @type {ValueRef}
         */
        this.property = property;

        /**
         * Optional self value
         * @type {?llvm.Value}
         */
        this.self = self;
    }
}
