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
