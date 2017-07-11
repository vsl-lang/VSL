/**
 * Manages an entire compilation. This manages multiple CompilationGroups
 * which represent modules or files compiled together. A primary
 * CompilationGroup is managed which inherits(?) public traits.
 *
 * This classes uses the {@link PropogateModifierTraverser} with the config:
 *
 *     {
 *         protected: p.Hide,
 *         private: p.Hide,
 *         public: p.Propogate
 *         none: p.Hide
 *     }
 */
export default class CompilationIndex {
    /**
     * Specifies the modules which will be compiled. Pass
     * {@link CompilationGroup}s which are _setup_ but not-compiled. This class
     * will automatically compile together using lazyHooking as applicable.
     *
     * @param {CompilationGroup}   root    The main compilation group which will
     *                                     be the one which is fully compiled.
     *                                     The rest will just have their scope
     *                                     (re)-traversed
     * @param {CompilationGroup[]} modules 
     */
    constructor(root, modules) {
        /** @private */
        this.root = root;
        
        /** @private */
        this.modules = modules;
    }
}
