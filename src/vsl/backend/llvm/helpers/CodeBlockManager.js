import MemoryManager from './MemoryManager';
/**
 * Wraps all backend info about a scope
 */
export default class CodeBlockManager {
    /**
     * Creates regarding a code block.
     * @param {CodeBlock} block the codeblocok
     * @param {LLVMContext} context
     */
    constructor(block, context) {
        /** @type {Scope} */
        this.scope = block.scope;

        /** @type {MemoryManager} */
        this.memory = new MemoryManager(this.scope, context);
    }
}
