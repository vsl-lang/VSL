export default class LLVMVector {
    /**
     * @param {number} length - length of vector
     * @param {LLVMType} type - Type of the vector's items
     */
    constructor(length: number, type: LLVMType) {
        /** @type {number} */
        this.length = length;
        
        /** @type {LLVMType} */
        this.type = type;
    }
    
    generate() {
        return `[${this.length} x ${this.type.generate()}]`
    }
}