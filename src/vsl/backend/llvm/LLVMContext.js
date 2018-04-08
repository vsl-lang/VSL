export const Key = {
    LValueContext: Symbol('LValueContext'),
    SpecializedGenericTy: Symbol('SpecializedGenericTy')
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
     * Pushes a value for a key
     * @param {Symbol} key
     * @param {Object} value
     */
    pushValue(key, value) {
        this._keys.set(key, value);
    }

    /**
     * Pops a value given a key
     * @param {Symbol} key Key as desc
     * @return {?Object} any value
     */
    popValue(key) {
        if (this._keys.has(key)) {
            const value = this._keys.get(key);
            this._keys.delete(key);
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
