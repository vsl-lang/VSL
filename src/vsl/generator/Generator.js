import Generatable from './Generatable';

/**
 * Controls LLVM IR genereration. Handles expressions, registers, and related
 * operations. While this keeps track of all generator operators you might
 * want to use a diffeernt class an pass this generator where requested.
 */
export default class Generator {
    constructor() {
        /**
         * A list of the forward or linkage declarations
         * 
         * @param {LLVMMethodPrototype[]}
         */
        this.declarations = [];
        
        /**
         * A list of type declarations
         * 
         * @type {LLVMType[]}
         */
        
        /**
         * A list of LLVM method declarations
         * 
         * @param {LLVMMethod[]}
         */
        this.methods = [];
        
        /**
         * A list of top-level, global, LLVM attributes. 
         * 
         * @type {LLVMAttribute[]}
         */
        this.attributes = []
    }
    
    /** @override */
    generate() {
        let items = [];
        
        for (let i = 0; i < this.attributes.length; i++) {
            items.push(
                `attributes #${i} = { ${this.attribues.generate()} }`
            )
        }
    }
}
