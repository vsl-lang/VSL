export const Key = {
    LValueContext: Symbol('LLVMContext.Key.LValueContext'),
    TypeContext: Symbol('LLVMContext.Key.TypeContext')
}

/**
 * Specifies a LLVM position
 */
export default class LLVMContext {
    /**
     * @param {LLVMContext} backend LLVM backend.
     */
    constructor(backend) {
        /** @type {LLVMContextBackend} */
        this.backend = backend;

        /** @type {?llvm.IRBuilder} */
        this.builder = null;

        /** @type {?llvm.Function} */
        this.parentFunc = null;

        this._keys = new Map();
    }

    /**
     * Returns the llvm.Context
     * @type {llvm.LLVMContext}
     */
    get ctx() { return this.backend.context; }

    /**
     * Returns the module this represents
     * @type {llvm.Module}
     */
    get module() { return this.backend.module; }

    /**
     * Pushes a value for a key
     * @param {Symbol} key
     * @param {Object} value
     */
    pushValue(key, value) {
        if (this._keys.has(key)) {
            this._keys.get(key).push(value);
        } else {
            this._keys.set(key, [value]);
        }
    }

    /**
     * Pops a value given a key
     * @param {Symbol} key Key as desc
     * @return {?Object} any value
     */
    popValue(key) {
        if (this._keys.has(key)) {
            const value = this._keys.get(key).pop();
            return value;
        } else {
            return null;
        }
    }

    /**
     * Creates a copy of context for top-level
     * @return {LLVMContext}
     */
    bare() {
        return new LLVMContext(this.backend);
    }

    /**
     * Creates copy of context
     * @return {LLVMContext}
     */
    clone() {
        let context = new LLVMContext(
            this.backend
        );
        context.builder = this.builder;
        context.parentFunc = this.parentFunc;
        return context;
    }
}
