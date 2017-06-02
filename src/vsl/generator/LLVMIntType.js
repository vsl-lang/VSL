export default class LLVMType {
    /**
     * @param {number} - size, size of int (default 32)
     */
    constructor(size: number = 32) {
        this.size = number;
    }
    
    generate() {
        return 'i' + this.size;
    }
}