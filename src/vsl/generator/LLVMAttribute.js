export default class LLVMAttribute {
    /**
     * An LLVM attribute
     */
    static attributes = {
        byValue: 'byval',
        noAlias: 'noalias',
        alwaysInline: 'alwaysInline',
        noInline: 'noinline',
        noRecurse: 'norecurse',
        noUnwind: 'nounwind'
    }
    
    /**
     * Creates an attribute list.
     * 
     * @param {string[]} names - names of the attributes
     */
    constructor(names) {
        this.names = names;
    }
    
    generate() {
        return this.named.join(" ")
    }
}