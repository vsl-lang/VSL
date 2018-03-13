/**
 * Refers to a value of some sort
 */
export default class ValueRef {
    /**
     * @param {llvm.Value} value The LLVM value object
     * @param {Object} data - describes value
     * @param {Boolean} data.isPtr If the value is a pointer to the actual value.
     */
    constructor(value, { isPtr, isDyn }) {
        /** @type {llvm.Value} */
        this.value = value;

        /** @type {Boolean} */
        this.isPtr = isPtr;

        /** @type {Boolean} */
        this.isDyn = isDyn;
    }

    /**
     * Generates the reference
     * @param {LLVMContext} context
     */
    generate(context) {
        let value = this.value;
        if (this.isDyn) {
            value = context.builder.createCall(value, []);
        }

        if (this.isPtr) {
            return context.builder.createLoad(value);
        } else {
            return value;
        }
    }
}
