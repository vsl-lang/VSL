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
    }
}
