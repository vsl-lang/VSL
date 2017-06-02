/**
 * Specifies the header `T f(a: U)` of a method.
 */
export default class LLVMMethodPrototype {
    constructor(type: LLVMType[], name: LLVMIdentifier, args: LLVMType[]) {
        this.type = type;
        this.args = args;
    }
    
    /** @override */
    generate() {
        `${this.type.generate()} ${this.name.generate()}(${
            this.args.map(i => i.generate()).join(", ")
        })`
    }
}