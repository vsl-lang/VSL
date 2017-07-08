/**
 * Manages an entire compilation. This manages multiple CompilationGroups
 * which represent modules or files compiled together. A primary
 * CompilationGroup is managed which inherits(?) public traits.
 */
export default class CompilationIndex {
    /**
     * Specifies the modules which will be compiled.
     *
     * @param  {CompilationGroup}   root         The primary compilation group
     *                                           to compile.
     */
    constructor(root) {
        /** @private */
        this.root = root;
    }
    
    
}
