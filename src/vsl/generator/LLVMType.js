export default class LLVMType {
    /**
     * @param {LLVMType|LLVMIdentifier|LLVMVector|LLVMIntType}
     */
    constructor(root: LLVMType, isPointer: bool) {
        this.root = root;
        this.isPointer = isPointer;
    }
    
    generate() {
        return this.root.generate() + (this.isPointer ? "*" : "")
    }
}