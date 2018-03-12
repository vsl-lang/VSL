/**
 * Refers to a value of some sort
 */
export default class ValueRef {
    /**
     * @param {llvm.Value} value The LLVM value object
     * @param {Boolean} isRef If the value is a pointer to the actual value.
     */
    constructor(value, isRef) {
        /** @type {llvm.Value} */
        this.value = value;

        /** @type {Boolean} */
        this.isRef = isRef;
    }

    /**
     * Generates the reference
     * @param {LLVMContext} context
     */
    generate(context) {
        if (this.isRef) {
            return context.builder.createLoad(this.value);
        } else {
            return this.value;
        }
    }
}
