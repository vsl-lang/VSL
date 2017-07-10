export default class LLVMType {
    /**
     * @param {LLVMType|LLVMIdentifier|LLVMVector|LLVMIntType} - root type
     */
    constructor(root: LLVMType, isPointer: bool) {
        this.root = root;
        this.isPointer = isPointer;
    }
    
    generate() {
        return this.root.generate() + (this.isPointer ? "*" : "")
    }
}
