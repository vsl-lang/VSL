import * as llvm from 'llvm-node';

/**
 * Refers to a value of some sort
 */
export default class ValueRef {
    /**
     * @param {llvm.Value} value The LLVM value object
     * @param {Object} data - describes value
     * @param {Boolean} [data.isPtr=false] If the value is a pointer to the
     *                                     actual value.
     * @param {Boolean} [data.isDyn=false] If the value is dynamic. Provide
     *                                     `didSet` for this. `value` is treated
     *                                     as a function and called w/ self if
     *                                     applicable.
     * @param {?Function} [data.didSet=null] Runs after set. Takes LLVMContext
     *                                       arg. This is for compiler-gen'd
     *                                       didSets for dyn sets.
     * @param {Boolean} [data.instance=false] If the value takes an instance
     *                                        parameter. (i.e. self param)
     */
    constructor(value, { isPtr = false, isDyn = false, didSet = null, instance = false } = {}) {
        /** @type {llvm.Value} */
        this.value = value;

        /** @type {Boolean} */
        this.isPtr = isPtr;

        /** @type {Boolean} */
        this.isDyn = isDyn;

        /** @type {Function} */
        this.didSet = didSet;

        /** @type {Boolean} */
        this.instance = instance;
    }

    /**
     * Creates a inst to set the value.
     * @param {llvm.Value} value - value to set
     * @param {LLVMContext} context
     * @param {?llvm.Value} self - The self value if applicable.
     */
    setValueTo(value, context, self) {
        if (this.isPtr) {
            return context.builder.createStore(value, this.value);
        } else if (this.isDyn) {
            return this.didSet(value, context, self);
        } else {
            throw new TypeError('Cannot use ValueRef#setValueTo with literal value');
        }
    }

    /**
     * Generates the reference
     * @param {LLVMContext} context
     * @param {?llvm.Value} self - IF the `ValueRef` is a dynamic property. This
     *                           value will be used as the `self` parameter.
     */
    generate(context, self) {
        let value = this.value;

        // If is computed prop then return call to fn to get val
        if (this.isDyn) {
            value = context.builder.createCall(value, self && this.instance ? [self] : []);
        }

        // If it ptr then deref ptr. Examples are global vars which are always
        // ptrs
        if (this.isPtr) {
            return context.builder.createLoad(value);
        } else {
            return value;
        }
    }
}
