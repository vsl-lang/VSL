import * as llvm from 'llvm-node';

/**
 * Refers to a value of some sort
 */
export default class ValueRef {
    /**
     * @param {llvm.Value} value The LLVM value object
     * @param {Object} data - describes value
     * @param {Boolean} data.isPtr If the value is a pointer to the actual value.
     * @param {Boolean} data.isDyn If the value is dynamic.
     * @param {number} data.aggregateSetter If the backingValue is an aggregate.
     * @param {?llvm.Value} backingValue The value storing the data for setters.
     */
    constructor(value, { isPtr, isDyn, aggregateSetter = null, backingValue = null }) {
        /** @type {llvm.Value} */
        this.value = value;

        /** @type {Boolean} */
        this.isPtr = isPtr;

        /** @type {Boolean} */
        this.isDyn = isDyn;

        /** @type {number} */
        this.aggregateSetter = aggregateSetter;

        /** @type {llvm.Value} */
        this.backingValue = backingValue;
    }

    /**
     * Creates a inst to set the value.
     * @param {llvm.Value} value - value to set
     * @param {LLVMContext} context
     */
    setValueTo(value, context) {
        if (this.isPtr) {
            return context.builder.createStore(value, this.value);
        } else if (this.isDyn) {
            const ptr = context.builder.createInBoundsGEP(
                    this.backingValue,
                    [
                        llvm.ConstantInt.get(context.backend.context, 0),
                        llvm.ConstantInt.get(context.backend.context, this.aggregateSetter)
                    ]
            );

            const store = context.builder.createStore(value, ptr);
            return store;
        } else {
            throw new TypeError('Cannot use ValueRef#setValueTo with literal value');
        }
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
